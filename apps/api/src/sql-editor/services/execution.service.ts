import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  StoredProcedure,
  StoredProcedureStatus,
} from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';

export interface ExecuteProcedureDto {
  parameters?: Record<string, any>;
  timeout?: number; // in seconds, default 30
}

export interface ProcedureExecutionResult {
  success: boolean;
  data?: any[];
  columns?: Array<{ name: string; type: string }>;
  error?: string;
  executionTime?: number; // in milliseconds
  rowCount?: number;
}

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly maxResultRows = 1000; // Limit result rows for safety

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly mssqlConnectionRegistry: MssqlConnectionRegistry,
    private readonly activitiesService: ActivitiesService
  ) {}

  async executeProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string,
    options: ExecuteProcedureDto = {}
  ): Promise<ProcedureExecutionResult> {
    const startTime = Date.now();
    this.logger.log(
      `Executing stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    // Get procedure
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
      relations: ['workspace'],
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    // Check if procedure is published
    if (procedure.status !== StoredProcedureStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot execute procedure in draft status. Please publish the procedure first.'
      );
    }

    if (!procedure.sqlPublished || procedure.sqlPublished.trim() === '') {
      throw new BadRequestException(
        'Procedure has no published content to execute'
      );
    }

    const timeout = Math.min(
      options.timeout ? options.timeout * 1000 : this.defaultTimeout,
      60000 // Max 60 seconds
    );

    try {
      // Get MSSQL connection
      const connection =
        await this.mssqlConnectionRegistry.getConnectionForWorkspace(
          workspaceId
        );

      // Execute procedure with timeout
      const result = await this.executeProcedureWithTimeout(
        connection,
        procedure.name,
        options.parameters || {},
        timeout
      );

      const executionTime = Date.now() - startTime;

      // Record successful execution activity (without result data)
      await this.activitiesService.record(
        userId,
        ActivityType.SQL_PROCEDURE_EXECUTED,
        `Executed stored procedure "${procedure.name}" in workspace "${procedure.workspace.name}"`,
        workspaceId,
        {
          procedureId: procedure.id,
          procedureName: procedure.name,
          executionTime,
          rowCount: result.rowCount,
          parameters: this.sanitizeParameters(options.parameters || {}),
        }
      );

      this.logger.log(
        `Successfully executed stored procedure ${procedure.name} in ${executionTime}ms`
      );
      return {
        success: true,
        data: result.data,
        columns: result.columns,
        executionTime,
        rowCount: result.rowCount,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(
        `Failed to execute stored procedure ${procedureId}:`,
        error
      );

      // Record failed execution activity
      await this.activitiesService.record(
        userId,
        ActivityType.SQL_PROCEDURE_EXECUTION_FAILED,
        `Failed to execute stored procedure "${procedure.name}" in workspace "${procedure.workspace.name}"`,
        workspaceId,
        {
          procedureId: procedure.id,
          procedureName: procedure.name,
          executionTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          parameters: this.sanitizeParameters(options.parameters || {}),
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  private async executeProcedureWithTimeout(
    connection: DataSource,
    procedureName: string,
    parameters: Record<string, any>,
    timeoutMs: number
  ): Promise<{
    data: any[];
    columns: Array<{ name: string; type: string }>;
    rowCount: number;
  }> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Procedure execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.executeProcedureInternal(connection, procedureName, parameters)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async executeProcedureInternal(
    connection: DataSource,
    procedureName: string,
    parameters: Record<string, any>
  ): Promise<{
    data: any[];
    columns: Array<{ name: string; type: string }>;
    rowCount: number;
  }> {
    try {
      // Build parameterized EXEC statement
      const { execSql, paramValues } = this.buildParameterizedExec(
        procedureName,
        parameters
      );

      // Execute the procedure
      const result = await connection.query(execSql, paramValues);

      // Process results
      let data: any[] = [];
      let columns: Array<{ name: string; type: string }> = [];
      let rowCount = 0;

      if (Array.isArray(result) && result.length > 0) {
        // Handle result set with metadata
        if (
          result[0] &&
          typeof result[0] === 'object' &&
          !Array.isArray(result[0])
        ) {
          // Single result set
          data = this.limitResultRows(result);
          rowCount = data.length;

          if (data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
              name: key,
              type: this.inferColumnType(data[0][key]),
            }));
          }
        } else if (Array.isArray(result[0])) {
          // Multiple result sets or different format
          data = this.limitResultRows(result[0]);
          rowCount = data.length;

          if (data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
              name: key,
              type: this.inferColumnType(data[0][key]),
            }));
          }
        }
      }

      return { data, columns, rowCount };
    } catch (error) {
      this.logger.error(
        `Internal execution error for procedure ${procedureName}:`,
        error
      );
      throw new Error(
        `Procedure execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildParameterizedExec(
    procedureName: string,
    parameters: Record<string, any>
  ): { execSql: string; paramValues: any[] } {
    const paramNames = Object.keys(parameters);
    const paramValues: any[] = [];

    if (paramNames.length === 0) {
      return {
        execSql: `EXEC [${procedureName}]`,
        paramValues: [],
      };
    }

    // Build parameter declarations and EXEC statement
    const declarations: string[] = [];
    const assignments: string[] = [];

    paramNames.forEach((paramName, index) => {
      const paramValue = parameters[paramName];
      const paramNameSafe = `@param_${index}`;

      // Add parameter declaration (simplified - in production you'd want better type inference)
      declarations.push(`${paramNameSafe} NVARCHAR(MAX)`);

      // Add parameter assignment
      assignments.push(`${paramNameSafe} = @p${index}`);

      // Add to values array for parameterized query
      paramValues.push(paramValue);
    });

    const execSql = `
      DECLARE ${declarations.join(', ')};
      SET ${assignments.join(', ')};
      EXEC [${procedureName}] ${paramNames.map((_, i) => `@param_${i}`).join(', ')};
    `;

    return { execSql, paramValues };
  }

  private limitResultRows(data: any[]): any[] {
    if (data.length <= this.maxResultRows) {
      return data;
    }

    this.logger.warn(
      `Result set truncated to ${this.maxResultRows} rows (original: ${data.length} rows)`
    );
    return data.slice(0, this.maxResultRows);
  }

  private inferColumnType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'decimal';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'datetime';
    if (typeof value === 'string') return 'string';
    return 'unknown';
  }

  private sanitizeParameters(
    parameters: Record<string, any>
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      // Remove sensitive data from logs
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate long string values
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  async canUserExecuteProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
    });

    if (!procedure) {
      return false;
    }

    // For now, allow execution if procedure is published
    // In a full implementation, you'd check workspace membership roles
    return procedure.status === StoredProcedureStatus.PUBLISHED;
  }
}

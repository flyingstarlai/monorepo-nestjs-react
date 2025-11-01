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
  consoleMessages?: string[]; // PRINT statements from procedure
  procedureName?: string; // Name of executed procedure
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
      const consoleMessages = result.consoleMessages || [];

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
        consoleMessages,
        procedureName: procedure.name,
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
    consoleMessages: string[];
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
    consoleMessages: string[];
  }> {
    try {
      // Build parameterized EXEC statement
      const { execSql, paramValues } = this.buildParameterizedExec(
        procedureName,
        parameters
      );

      // Execute the procedure and capture PRINT statements
      const consoleMessages: string[] = [];

      const driver: any = (connection as any).driver;
      let result: any;

      // Prefer native mssql Request to capture PRINT/INFO messages
      if (driver && driver.mssql && driver.master) {
        const sql = driver.mssql;
        const pool = driver.master;
        const request = new sql.Request(pool);

        // Capture informational messages (PRINT / low-severity RAISERROR)
        request.on('info', (msg: any) => {
          const text = String((msg && (msg.message ?? msg.text)) || '');
          if (text) consoleMessages.push(text);
        });

        try {
          result = await request.query(`SET NOCOUNT ON; ${execSql}`);
        } catch (e) {
          // Fallback to TypeORM query if direct request fails
          result = await connection.query(execSql, paramValues);
        }
      } else {
        // Fallback when driver internals are unavailable (no PRINT capture)
        result = await connection.query(execSql, paramValues);
      }

      // Process results across possible driver shapes (mssql Request vs TypeORM query)
      let data: any[] = [];
      let columns: Array<{ name: string; type: string }> = [];
      let rowCount = 0;

      // Case 1: mssql Request response object
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const primary = Array.isArray(result.recordset)
          ? result.recordset
          : Array.isArray(result.recordsets) && result.recordsets.length > 0
            ? result.recordsets[0]
            : undefined;
        if (Array.isArray(primary)) {
          data = this.limitResultRows(primary);
          rowCount = data.length;
          if (data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
              name: key,
              type: this.inferColumnType((data[0] as any)[key]),
            }));
          }
        }
      }

      // Case 2: TypeORM connection.query array response
      if (data.length === 0 && Array.isArray(result) && result.length > 0) {
        if (result[0] && typeof result[0] === 'object' && !Array.isArray(result[0])) {
          // Single result set
          data = this.limitResultRows(result);
          rowCount = data.length;
          if (data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
              name: key,
              type: this.inferColumnType((data[0] as any)[key]),
            }));
          }
        } else if (Array.isArray(result[0])) {
          // Multiple result sets
          data = this.limitResultRows(result[0]);
          rowCount = data.length;
          if (data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
              name: key,
              type: this.inferColumnType((data[0] as any)[key]),
            }));
          }
        }
      }

      return { data, columns, rowCount, consoleMessages };
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

    // Validate parameters
    if (paramNames.length === 0) {
      return {
        execSql: `EXEC [${procedureName}]`,
        paramValues: [],
      };
    }

    // Log parameter details for debugging
    this.logger.debug(`Building parameterized EXEC for ${procedureName}`, {
      paramNames,
      paramCount: paramNames.length,
      sanitizedParams: this.sanitizeParameters(parameters)
    });

    // Build parameter declarations and assignments using original parameter names
    const declarations: string[] = [];
    const assignments: string[] = [];

    paramNames.forEach((paramName) => {
      const paramValue = parameters[paramName];

      // Validate parameter name
      if (!paramName || typeof paramName !== 'string') {
        throw new Error(`Invalid parameter name: ${paramName}`);
      }

      // Validate parameter value
      if (paramValue === undefined) {
        this.logger.warn(`Parameter '${paramName}' is undefined for procedure ${procedureName}`);
      }

      // Infer parameter type based on value
      const paramType = this.inferParameterType(paramValue);
      declarations.push(`@${paramName} ${paramType}`);

      // Add parameter assignment - set the value directly
      assignments.push(`@${paramName} = ${this.formatParameterValue(paramValue)}`);

      // Add to values array
      paramValues.push(paramValue);

      this.logger.debug(`Parameter: @${paramName} = ${paramValue} (${paramType})`);
    });

    const execSql = `
      DECLARE ${declarations.join(', ')};
      ${assignments.map(assignment => `SET ${assignment};`).join('\n      ')}
      EXEC [${procedureName}] ${paramNames.map(name => `@${name}`).join(', ')};
    `;

    this.logger.debug(`Generated SQL for ${procedureName}:`, execSql);
    this.logger.debug(`Parameters:`, parameters);

    return { execSql, paramValues };
  }

  private inferParameterType(value: any): string {
    if (value === null || value === undefined) return 'NVARCHAR(MAX)';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INT' : 'DECIMAL(18,4)';
    }
    if (typeof value === 'boolean') return 'BIT';
    if (value instanceof Date) return 'DATETIME';
    if (typeof value === 'string') {
      // For longer strings, use NVARCHAR(MAX), for shorter ones, use appropriate length
      return value.length > 100 ? 'NVARCHAR(MAX)' : `NVARCHAR(${Math.max(value.length, 50)})`;
    }
    return 'NVARCHAR(MAX)';
  }

  private formatParameterValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return String(value);
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

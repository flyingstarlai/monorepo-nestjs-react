import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  StoredProcedure,
  StoredProcedureStatus,
} from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';
import {
  IPublisher,
  PublishContext,
} from '../interfaces/publishing.interfaces';
import { PublisherService } from '../publishers/publisher.service';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly mssqlConnectionRegistry: MssqlConnectionRegistry,
    private readonly activitiesService: ActivitiesService,
    private readonly publisher: PublisherService
  ) {}

  async publishProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Publishing stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    // Get the procedure
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
      relations: ['workspace'],
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    if (!procedure.sqlDraft || procedure.sqlDraft.trim() === '') {
      throw new Error('Cannot publish procedure with empty draft content');
    }

    const publishContext: PublishContext = {
      workspaceId,
      procedureId,
      userId,
    };

    try {
      // Step 1: Precheck validation
      const precheckResult = await this.publisher.precheck(
        publishContext,
        procedure.sqlDraft
      );
      if (!precheckResult.canProceed) {
        const errorMessages =
          precheckResult.issues?.map((issue) => issue.message).join('; ') ||
          'Unknown validation error';
        throw new Error(`Precheck validation failed: ${errorMessages}`);
      }

      // Step 2: Deploy
      const deployResult = await this.publisher.deploy(
        publishContext,
        procedure.sqlDraft
      );
      if (!deployResult.success) {
        const errorMessages =
          deployResult.issues?.map((issue) => issue.message).join('; ') ||
          'Unknown deployment error';
        throw new Error(`Deployment failed: ${errorMessages}`);
      }

      // Step 3: Verify
      const verifyResult = await this.publisher.verify(
        publishContext,
        procedure.name
      );
      if (!verifyResult.verified) {
        const errorMessages =
          verifyResult.issues?.map((issue) => issue.message).join('; ') ||
          'Unknown verification error';
        throw new Error(`Verification failed: ${errorMessages}`);
      }

      // Update procedure in PostgreSQL
      await this.storedProcedureRepository.update(procedureId, {
        status: StoredProcedureStatus.PUBLISHED,
        sqlPublished: procedure.sqlDraft,
        publishedAt: new Date(),
      });

      // Get updated procedure
      const updatedProcedure = await this.storedProcedureRepository.findOne({
        where: { id: procedureId },
      });

      if (!updatedProcedure) {
        throw new NotFoundException('Stored procedure not found after update');
      }

      // Record publish activity
      await this.activitiesService.record(
        userId,
        ActivityType.SQL_PROCEDURE_PUBLISHED,
        `Published stored procedure "${procedure.name}" in workspace "${procedure.workspace.name}"`,
        workspaceId,
        { procedureId: procedure.id, procedureName: procedure.name }
      );

      this.logger.log(
        `Successfully published stored procedure ${procedure.name} for workspace ${workspaceId}`
      );
      return updatedProcedure;
    } catch (error) {
      this.logger.error(
        `Failed to publish stored procedure ${procedureId}:`,
        error
      );

      // Record failed publish activity
      const procedure = await this.storedProcedureRepository.findOne({
        where: { id: procedureId },
        relations: ['workspace'],
      });

      if (procedure) {
        await this.activitiesService.record(
          userId,
          ActivityType.SQL_PROCEDURE_PUBLISH_FAILED,
          `Failed to publish stored procedure "${procedure.name}" in workspace "${procedure.workspace.name}"`,
          workspaceId,
          {
            procedureId: procedure.id,
            procedureName: procedure.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }

      throw new Error(
        `Failed to publish stored procedure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async unpublishProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Unpublishing stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
      relations: ['workspace'],
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    if (procedure.status !== StoredProcedureStatus.PUBLISHED) {
      throw new Error('Procedure is not published');
    }

    try {
      // Get MSSQL connection
      const connection =
        await this.mssqlConnectionRegistry.getConnectionForWorkspace(
          workspaceId
        );

      // Drop procedure from MSSQL
      await this.dropProcedureFromMssql(connection, procedure.name);

      // Update procedure in PostgreSQL
      await this.storedProcedureRepository.update(procedureId, {
        status: StoredProcedureStatus.DRAFT,
        sqlPublished: null,
        publishedAt: null,
      });

      // Get updated procedure
      const updatedProcedure = await this.storedProcedureRepository.findOne({
        where: { id: procedureId },
      });

      if (!updatedProcedure) {
        throw new NotFoundException('Stored procedure not found after update');
      }

      // Record unpublish activity
      await this.activitiesService.record(
        userId,
        ActivityType.SQL_PROCEDURE_UNPUBLISHED,
        `Unpublished stored procedure "${procedure.name}" in workspace "${procedure.workspace.name}"`,
        workspaceId,
        { procedureId: procedure.id, procedureName: procedure.name }
      );

      this.logger.log(
        `Successfully unpublished stored procedure ${procedure.name} for workspace ${workspaceId}`
      );
      return updatedProcedure;
    } catch (error) {
      this.logger.error(
        `Failed to unpublish stored procedure ${procedureId}:`,
        error
      );
      throw new Error(
        `Failed to unpublish stored procedure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async deployProcedureToMssql(
    connection: any,
    procedureName: string,
    procedureSql: string
  ): Promise<void> {
    try {
      // Create CREATE OR ALTER PROCEDURE statement
      const createProcedureSql = this.buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      // Log the SQL being executed (truncated for very long procedures)
      const sqlLog =
        createProcedureSql.length > 500
          ? createProcedureSql.substring(0, 500) + '...'
          : createProcedureSql;
      this.logger.debug(
        `Deploying procedure ${procedureName} to MSSQL. SQL: ${sqlLog}`
      );

      // Execute the deployment
      await connection.query(createProcedureSql);

      this.logger.debug(
        `Successfully deployed procedure ${procedureName} to MSSQL`
      );
    } catch (error) {
      // Enhanced error logging with more context
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to deploy procedure ${procedureName} to MSSQL. Error: ${errorMessage}`,
        {
          procedureName,
          sqlLength: procedureSql.length,
          sqlPreview:
            procedureSql.substring(0, 200) +
            (procedureSql.length > 200 ? '...' : ''),
          originalError: error,
          stack: errorStack,
        }
      );

      // Parse MSSQL error for better user feedback
      const enhancedError = this.parseMssqlDeployError(errorMessage);
      throw new Error(`MSSQL deployment failed: ${enhancedError}`);
    }
  }

  private async dropProcedureFromMssql(
    connection: any,
    procedureName: string
  ): Promise<void> {
    try {
      // Check if procedure exists before dropping
      const checkSql = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_TYPE = 'PROCEDURE' 
        AND ROUTINE_NAME = '${procedureName}'
      `;

      const result = await connection.query(checkSql);
      const exists = result[0]?.count > 0;

      if (exists) {
        const dropSql = `DROP PROCEDURE IF EXISTS [${procedureName}]`;
        await connection.query(dropSql);
        this.logger.debug(
          `Successfully dropped procedure ${procedureName} from MSSQL`
        );
      } else {
        this.logger.debug(
          `Procedure ${procedureName} does not exist in MSSQL, skipping drop`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to drop procedure ${procedureName} from MSSQL:`,
        error
      );
      throw new Error(
        `MSSQL drop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildCreateProcedureSql(
    procedureName: string,
    procedureSql: string
  ): string {
    const sql = procedureSql.trim();

    // Detect if the SQL already includes a full procedure definition
    const hasHeader = /\bcreate\s+(or\s+alter\s+)?procedure\b/i.test(sql);

    if (hasHeader) {
      // If it's a full definition, execute it directly without wrapping
      // This avoids nested BEGIN/END block conflicts
      const sanitized = sql.replace(/^\s*go\s*$/gim, '').trim();
      return sanitized;
    }

    // Treat the input as the procedure body and wrap it in a proper definition
    const body = sql.trim();

    // Build the complete CREATE OR ALTER PROCEDURE statement
    const fullProcedureSql = `CREATE OR ALTER PROCEDURE [${procedureName}] AS\n${body}`;

    return fullProcedureSql;
  }

  private escapeSqlString(sql: string): string {
    // Escape single quotes by doubling them
    const escaped = sql.replace(/'/g, "''");
    // Return as N'...' string literal
    return `'${escaped}'`;
  }

  private parseMssqlDeployError(errorMessage: string): string {
    // Try to extract line and column information from MSSQL error messages
    const lineMatch = errorMessage.match(/line\s+(\d+):/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : undefined;

    const nearMatch = errorMessage.match(/near\s+'([^']+)'/i);

    // Clean up common MSSQL error messages
    let cleanError = errorMessage;

    // Remove SQL Server specific prefixes
    cleanError = cleanError.replace(
      /^Msg\s+\d+,\s+Level\s+\d+,\s+State\s+\d+,\s+Line\s+\d+:\s*/i,
      ''
    );
    cleanError = cleanError.replace(
      /^Microsoft\s+SQL\s+Server\s+Error\s+\d+:\s*/i,
      ''
    );

    // Remove duplicate line information
    if (line && cleanError.includes(`Line ${line}:`)) {
      cleanError = cleanError.replace(/Line\s+\d+:\s*/i, '');
    }

    // Add line number information if available
    if (line) {
      cleanError = `Line ${line}: ${cleanError}`;
    }

    // Add helpful context for common deployment errors
    if (cleanError.includes('Incorrect syntax near')) {
      if (nearMatch) {
        const invalidToken = nearMatch[1];
        cleanError += ` → Check syntax near '${invalidToken}' and ensure proper SQL structure`;
      }
    }

    if (
      cleanError.includes('already exists') ||
      cleanError.includes('There is already an object')
    ) {
      cleanError += ' → Try using CREATE OR ALTER instead of CREATE';
    }

    return cleanError.trim();
  }

  async canUserPublishProcedure(
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

    // For now, we'll implement basic permission checking
    // In a full implementation, you'd check workspace membership roles
    // This would be enhanced with proper RBAC integration
    return procedure.createdBy === userId;
  }
}

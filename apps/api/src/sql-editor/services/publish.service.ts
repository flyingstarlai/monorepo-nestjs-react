import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StoredProcedure, StoredProcedureStatus } from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly mssqlConnectionRegistry: MssqlConnectionRegistry,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async publishProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(`Publishing stored procedure ${procedureId} for workspace ${workspaceId}`);

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

    try {
      // Get MSSQL connection
      const connection = await this.mssqlConnectionRegistry.getConnectionForWorkspace(workspaceId);

      // Deploy to MSSQL using CREATE OR ALTER PROCEDURE
      await this.deployProcedureToMssql(connection, procedure.name, procedure.sqlDraft);

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

      this.logger.log(`Successfully published stored procedure ${procedure.name} for workspace ${workspaceId}`);
      return updatedProcedure;
    } catch (error) {
      this.logger.error(`Failed to publish stored procedure ${procedureId}:`, error);
      
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
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        );
      }

      throw new Error(`Failed to publish stored procedure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unpublishProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(`Unpublishing stored procedure ${procedureId} for workspace ${workspaceId}`);

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
      const connection = await this.mssqlConnectionRegistry.getConnectionForWorkspace(workspaceId);

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

      this.logger.log(`Successfully unpublished stored procedure ${procedure.name} for workspace ${workspaceId}`);
      return updatedProcedure;
    } catch (error) {
      this.logger.error(`Failed to unpublish stored procedure ${procedureId}:`, error);
      throw new Error(`Failed to unpublish stored procedure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deployProcedureToMssql(
    connection: DataSource,
    procedureName: string,
    procedureSql: string
  ): Promise<void> {
    try {
      // Create CREATE OR ALTER PROCEDURE statement
      const createProcedureSql = this.buildCreateProcedureSql(procedureName, procedureSql);

      // Execute the deployment
      await connection.query(createProcedureSql);

      this.logger.debug(`Successfully deployed procedure ${procedureName} to MSSQL`);
    } catch (error) {
      this.logger.error(`Failed to deploy procedure ${procedureName} to MSSQL:`, error);
      throw new Error(`MSSQL deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async dropProcedureFromMssql(
    connection: DataSource,
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
        this.logger.debug(`Successfully dropped procedure ${procedureName} from MSSQL`);
      } else {
        this.logger.debug(`Procedure ${procedureName} does not exist in MSSQL, skipping drop`);
      }
    } catch (error) {
      this.logger.error(`Failed to drop procedure ${procedureName} from MSSQL:`, error);
      throw new Error(`MSSQL drop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildCreateProcedureSql(procedureName: string, procedureSql: string): string {
    // Extract the procedure body (everything after AS)
    const asIndex = procedureSql.toLowerCase().lastIndexOf(' as ');
    if (asIndex === -1) {
      throw new Error('Procedure SQL must contain "AS" keyword');
    }

    const procedureBody = procedureSql.substring(asIndex + 4).trim();

    // Build CREATE OR ALTER PROCEDURE statement
    return `CREATE OR ALTER PROCEDURE [${procedureName}] AS\n${procedureBody}`;
  }

  async canUserPublishProcedure(procedureId: string, workspaceId: string, userId: string): Promise<boolean> {
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
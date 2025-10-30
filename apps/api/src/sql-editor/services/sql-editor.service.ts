import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StoredProcedure,
  StoredProcedureStatus,
} from '../entities/stored-procedure.entity';
import {
  CreateStoredProcedureDto,
  UpdateStoredProcedureDto,
} from '../dto/stored-procedure.dto';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';

@Injectable()
export class SqlEditorService {
  private readonly logger = new Logger(SqlEditorService.name);

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createProcedure(
    workspaceId: string,
    createDto: CreateStoredProcedureDto,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Creating stored procedure "${createDto.name}" for workspace ${workspaceId}`
    );

    // Check if procedure with same name already exists in workspace
    const existingProcedure = await this.storedProcedureRepository.findOne({
      where: { workspaceId, name: createDto.name },
    });

    if (existingProcedure) {
      throw new ForbiddenException(
        `A stored procedure named "${createDto.name}" already exists in this workspace`
      );
    }

    const procedure = this.storedProcedureRepository.create({
      ...createDto,
      workspaceId,
      createdBy: userId,
      status: StoredProcedureStatus.DRAFT,
    });

    const savedProcedure = await this.storedProcedureRepository.save(procedure);

    // Record creation activity
    await this.activitiesService.record(
      userId,
      ActivityType.SQL_PROCEDURE_CREATED,
      `Created stored procedure "${createDto.name}"`,
      workspaceId,
      { procedureId: savedProcedure.id, procedureName: createDto.name }
    );

    this.logger.log(
      `Successfully created stored procedure ${savedProcedure.id}`
    );
    return savedProcedure;
  }

  async getProceduresForWorkspace(
    workspaceId: string
  ): Promise<StoredProcedure[]> {
    this.logger.debug(`Getting stored procedures for workspace ${workspaceId}`);

    return this.storedProcedureRepository.find({
      where: { workspaceId },
      order: { updatedAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async getProcedureById(
    procedureId: string,
    workspaceId: string
  ): Promise<StoredProcedure> {
    this.logger.debug(
      `Getting stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
      relations: ['creator'],
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    return procedure;
  }

  async updateProcedure(
    procedureId: string,
    workspaceId: string,
    updateDto: UpdateStoredProcedureDto,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Updating stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    const procedure = await this.getProcedureById(procedureId, workspaceId);

    // Check if user can update this procedure
    // For now, allow any workspace member to update procedures
    // In a full implementation, you'd check workspace membership roles

    // If updating name, check for uniqueness
    if (updateDto.name && updateDto.name !== procedure.name) {
      const existingProcedure = await this.storedProcedureRepository.findOne({
        where: { workspaceId, name: updateDto.name },
      });

      if (existingProcedure) {
        throw new ForbiddenException(
          `A stored procedure named "${updateDto.name}" already exists in this workspace`
        );
      }
    }

    // Update procedure
    await this.storedProcedureRepository.update(procedureId, {
      ...updateDto,
      // If procedure is published and we're updating the draft, keep published content
      ...(procedure.status === StoredProcedureStatus.PUBLISHED &&
      updateDto.sqlDraft
        ? {}
        : { status: StoredProcedureStatus.DRAFT }),
    });

    const updatedProcedure = await this.getProcedureById(
      procedureId,
      workspaceId
    );

    // Record update activity
    await this.activitiesService.record(
      userId,
      ActivityType.SQL_PROCEDURE_UPDATED,
      `Updated stored procedure "${updatedProcedure.name}"`,
      workspaceId,
      { procedureId: updatedProcedure.id, procedureName: updatedProcedure.name }
    );

    this.logger.log(`Successfully updated stored procedure ${procedureId}`);
    return updatedProcedure;
  }

  async deleteProcedure(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<void> {
    this.logger.log(
      `Deleting stored procedure ${procedureId} for workspace ${workspaceId}`
    );

    const procedure = await this.getProcedureById(procedureId, workspaceId);

    // Check if user can delete this procedure
    if (procedure.createdBy !== userId) {
      throw new ForbiddenException(
        'You can only delete procedures you created'
      );
    }

    await this.storedProcedureRepository.delete(procedureId);

    // Record deletion activity
    await this.activitiesService.record(
      userId,
      ActivityType.SQL_PROCEDURE_DELETED,
      `Deleted stored procedure "${procedure.name}"`,
      workspaceId,
      { procedureId: procedure.id, procedureName: procedure.name }
    );

    this.logger.log(`Successfully deleted stored procedure ${procedureId}`);
  }

  async duplicateProcedure(
    procedureId: string,
    workspaceId: string,
    newName: string,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Duplicating stored procedure ${procedureId} as "${newName}" for workspace ${workspaceId}`
    );

    const originalProcedure = await this.getProcedureById(
      procedureId,
      workspaceId
    );

    // Check if new name is unique
    const existingProcedure = await this.storedProcedureRepository.findOne({
      where: { workspaceId, name: newName },
    });

    if (existingProcedure) {
      throw new ForbiddenException(
        `A stored procedure named "${newName}" already exists in this workspace`
      );
    }

    const duplicatedProcedure = this.storedProcedureRepository.create({
      name: newName,
      sqlDraft: originalProcedure.sqlDraft,
      workspaceId,
      createdBy: userId,
      status: StoredProcedureStatus.DRAFT, // Always start as draft
    });

    const savedProcedure =
      await this.storedProcedureRepository.save(duplicatedProcedure);

    // Record duplication activity
    await this.activitiesService.record(
      userId,
      ActivityType.SQL_PROCEDURE_CREATED,
      `Duplicated stored procedure "${originalProcedure.name}" as "${newName}"`,
      workspaceId,
      {
        procedureId: savedProcedure.id,
        procedureName: newName,
        originalProcedureId: originalProcedure.id,
        originalProcedureName: originalProcedure.name,
      }
    );

    this.logger.log(
      `Successfully duplicated stored procedure ${procedureId} as ${savedProcedure.id}`
    );
    return savedProcedure;
  }

  async getProcedureStats(workspaceId: string): Promise<{
    total: number;
    draft: number;
    published: number;
  }> {
    this.logger.debug(`Getting procedure stats for workspace ${workspaceId}`);

    const [total, draft, published] = await Promise.all([
      this.storedProcedureRepository.count({ where: { workspaceId } }),
      this.storedProcedureRepository.count({
        where: { workspaceId, status: StoredProcedureStatus.DRAFT },
      }),
      this.storedProcedureRepository.count({
        where: { workspaceId, status: StoredProcedureStatus.PUBLISHED },
      }),
    ]);

    return { total, draft, published };
  }

  async canUserAccessProcedure(
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

    // For now, allow access if user is in workspace
    // In a full implementation, you'd check workspace membership
    return true;
  }

  async canUserEditProcedure(
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

    // For now, allow editing if user created the procedure
    // In a full implementation, you'd check workspace membership roles
    return procedure.createdBy === userId;
  }

  async canUserDeleteProcedure(
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

    // For now, allow deletion if user created the procedure
    // In a full implementation, you'd check workspace membership roles
    return procedure.createdBy === userId;
  }
}

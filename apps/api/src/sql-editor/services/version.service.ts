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
  StoredProcedureVersion,
  StoredProcedureVersionSource,
} from '../entities/stored-procedure-version.entity';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  constructor(
    @InjectRepository(StoredProcedureVersion)
    private readonly versionRepository: Repository<StoredProcedureVersion>,
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createVersion(
    procedureId: string,
    workspaceId: string,
    name: string,
    sqlText: string,
    source: StoredProcedureVersionSource,
    createdBy: string
  ): Promise<StoredProcedureVersion> {
    this.logger.debug(
      `Creating version for procedure ${procedureId}, source=${source}`
    );

    // Get next version number for this procedure
    const lastVersion = await this.versionRepository.findOne({
      where: { procedureId },
      order: { version: 'DESC' },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;

    const version = this.versionRepository.create({
      procedureId,
      workspaceId,
      version: nextVersion,
      source,
      name,
      sqlText,
      createdBy,
    });

    const savedVersion = await this.versionRepository.save(version);

    // Record version creation activity
    await this.activitiesService.record(
      createdBy,
      ActivityType.SQL_PROCEDURE_VERSION_CREATED,
      `Created version ${nextVersion} for stored procedure "${name}" (${source})`,
      workspaceId,
      {
        procedureId,
        procedureName: name,
        version: nextVersion,
        source,
      }
    );

    this.logger.log(
      `Successfully created version ${nextVersion} for procedure ${procedureId}`
    );
    return savedVersion;
  }

  async getVersionsForProcedure(
    procedureId: string,
    workspaceId: string
  ): Promise<StoredProcedureVersion[]> {
    console.log('🔍 Service getVersionsForProcedure Debug:', {
      procedureId,
      workspaceId,
      procedureIdType: typeof procedureId,
      workspaceIdType: typeof workspaceId
    });

    this.logger.debug(
      `Getting versions for procedure ${procedureId} in workspace ${workspaceId}`
    );

    const versions = await this.versionRepository.find({
      where: { procedureId, workspaceId, source: StoredProcedureVersionSource.PUBLISHED },
      order: { createdAt: 'DESC' },
      relations: ['creator'],
    });

    console.log('✅ Service getVersionsForProcedure Result:', {
      queryWhere: { procedureId, workspaceId },
      versionsCount: versions?.length || 0,
      versions: versions?.map(v => ({
        id: v.id,
        version: v.version,
        name: v.name,
        source: v.source,
        procedureId: v.procedureId,
        workspaceId: v.workspaceId,
        createdBy: v.createdBy,
        createdAt: v.createdAt
      }))
    });

    // Data integrity check
    versions.forEach(version => {
      if (version.procedureId !== procedureId) {
        console.error('❌ Data integrity issue:', {
          expectedProcedureId: procedureId,
          actualProcedureId: version.procedureId,
          versionId: version.id,
          versionNumber: version.version
        });
      }
      if (version.workspaceId !== workspaceId) {
        console.error('❌ Workspace mismatch:', {
          expectedWorkspaceId: workspaceId,
          actualWorkspaceId: version.workspaceId,
          versionId: version.id,
          versionNumber: version.version
        });
      }
    });

    return versions;
  }

  async getVersionByNumber(
    procedureId: string,
    workspaceId: string,
    version: number
  ): Promise<StoredProcedureVersion> {
    this.logger.debug(
      `Getting version ${version} for procedure ${procedureId} in workspace ${workspaceId}`
    );

    const versionRecord = await this.versionRepository.findOne({
      where: { procedureId, workspaceId, version },
      relations: ['creator'],
    });

    if (!versionRecord) {
      throw new NotFoundException(
        `Version ${version} not found for procedure ${procedureId}`
      );
    }

    return versionRecord;
  }

  async rollbackToVersion(
    procedureId: string,
    workspaceId: string,
    version: number,
    userId: string
  ): Promise<StoredProcedure> {
    this.logger.log(
      `Rolling back procedure ${procedureId} to version ${version} for workspace ${workspaceId}`
    );

    // Get the version to rollback to
    const versionRecord = await this.getVersionByNumber(
      procedureId,
      workspaceId,
      version
    );

    // Get the current procedure
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
      relations: ['workspace'],
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    // Update procedure to draft with the version's SQL
    await this.storedProcedureRepository.update(procedureId, {
      status: StoredProcedureStatus.DRAFT,
      sqlDraft: versionRecord.sqlText,
    });


    // Get updated procedure
    const updatedProcedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId },
    });

    if (!updatedProcedure) {
      throw new NotFoundException('Stored procedure not found after update');
    }

    // Record rollback activity
    await this.activitiesService.record(
      userId,
      ActivityType.SQL_PROCEDURE_VERSION_ROLLED_BACK,
      `Rolled back stored procedure "${procedure.name}" to version ${version}`,
      workspaceId,
      {
        procedureId: procedure.id,
        procedureName: procedure.name,
        rollbackVersion: version,
      }
    );

    this.logger.log(
      `Successfully rolled back procedure ${procedureId} to version ${version}`
    );
    return updatedProcedure;
  }

  async canUserViewVersions(
    procedureId: string,
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    // For now, allow any workspace member to view versions
    // In a full implementation, you'd check workspace membership
    return true;
  }

  async canUserRollbackProcedure(
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

    // For now, allow rollback if user created the procedure
    // In a full implementation, you'd check workspace membership roles
    return procedure.createdBy === userId;
  }
}
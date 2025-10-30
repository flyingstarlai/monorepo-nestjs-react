import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from './entities/environment.entity';
import { Workspace } from './entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from './entities/workspace-member.entity';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { WorkspaceConnectionManager } from './connection-manager.service';

export interface CreateEnvironmentDto {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionTimeout?: number;
  encrypt?: boolean;
}

export interface UpdateEnvironmentDto {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionTimeout?: number;
  encrypt?: boolean;
}

export interface TestConnectionDto {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionTimeout?: number;
  encrypt?: boolean;
}

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly activitiesService: ActivitiesService,
    private readonly connectionManager: WorkspaceConnectionManager
  ) {}

  async findByWorkspace(workspaceId: string): Promise<Environment | null> {
    return this.environmentRepository.findOne({
      where: { workspace: { id: workspaceId } },
      relations: ['workspace'],
    });
  }

  async findBySlug(slug: string): Promise<Environment | null> {
    const workspace = await this.workspaceRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!workspace) {
      return null;
    }

    return this.findByWorkspace(workspace.id);
  }

  async createEnvironment(
    workspaceId: string,
    data: CreateEnvironmentDto,
    userId: string
  ): Promise<Environment> {
    // Check if user has permission (Owner or Admin)
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    const allowedRoles = [WorkspaceRole.OWNER, WorkspaceRole.AUTHOR];
    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        'Only workspace owners and authors can create environment configurations'
      );
    }

    // Check if environment already exists for this workspace
    const existing = await this.findByWorkspace(workspaceId);
    if (existing) {
      throw new ForbiddenException(
        'Environment configuration already exists for this workspace'
      );
    }

    // Verify workspace exists
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const environment = this.environmentRepository.create({
      ...data,
      workspace,
      createdBy: userId,
      connectionStatus: 'unknown',
    });

    const savedEnvironment = await this.environmentRepository.save(environment);

    // Record environment creation activity
    await this.activitiesService.record(
      userId,
      ActivityType.ENVIRONMENT_CREATED,
      `Environment configuration created for workspace "${workspace.name}"`,
      workspaceId
    );

    return savedEnvironment;
  }

  async updateEnvironment(
    workspaceId: string,
    data: UpdateEnvironmentDto,
    userId: string
  ): Promise<Environment> {
    // Check if user has permission (Owner or Admin)
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    const allowedRoles = [WorkspaceRole.OWNER, WorkspaceRole.AUTHOR];
    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        'Only workspace owners and authors can update environment configurations'
      );
    }

    const environment = await this.findByWorkspace(workspaceId);
    if (!environment) {
      throw new NotFoundException('Environment configuration not found');
    }

    await this.environmentRepository.update(environment.id, {
      ...data,
      updatedBy: userId,
      connectionStatus: 'unknown', // Reset status when config changes
      lastTestedAt: null, // Clear last test timestamp
    });

    const updatedEnvironment = await this.environmentRepository.findOne({
      where: { id: environment.id },
      relations: ['workspace'],
    });

    if (!updatedEnvironment) {
      throw new NotFoundException(
        'Environment configuration not found after update'
      );
    }

    // Record environment update activity
    await this.activitiesService.record(
      userId,
      ActivityType.ENVIRONMENT_UPDATED,
      `Environment configuration updated for workspace "${updatedEnvironment.workspace.name}"`,
      workspaceId
    );

    return updatedEnvironment;
  }

  async deleteEnvironment(workspaceId: string, userId: string): Promise<void> {
    // Check if user has permission (Owner or Admin)
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    const allowedRoles = [WorkspaceRole.OWNER, WorkspaceRole.AUTHOR];
    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        'Only workspace owners and authors can delete environment configurations'
      );
    }

    const environment = await this.findByWorkspace(workspaceId);
    if (!environment) {
      throw new NotFoundException('Environment configuration not found');
    }

    await this.environmentRepository.delete(environment.id);

    // Record environment deletion activity
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (workspace) {
      await this.activitiesService.record(
        userId,
        ActivityType.ENVIRONMENT_DELETED,
        `Environment configuration deleted for workspace "${workspace.name}"`,
        workspaceId
      );
    }
  }

  async testConnection(
    workspaceId: string,
    data: TestConnectionDto,
    userId: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    // Check if user has permission (Owner or Admin)
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    const allowedRoles = [WorkspaceRole.OWNER, WorkspaceRole.AUTHOR];
    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        'Only workspace owners and authors can test environment connections'
      );
    }

    try {
      const {
        host,
        port,
        username,
        password,
        database,
        connectionTimeout = 30000,
        encrypt = false,
      } = data;

      // Use connection manager to test the connection
      const testResult = await this.connectionManager.testConnection({
        host,
        port,
        username,
        password,
        database,
        connectionTimeout,
        encrypt,
      });

      // Update environment status if it exists
      const environment = await this.findByWorkspace(workspaceId);
      if (environment) {
        await this.environmentRepository.update(environment.id, {
          connectionStatus: testResult.success ? 'connected' : 'failed',
          lastTestedAt: new Date(),
        });
      }

      if (testResult.success) {
        return {
          success: true,
          message: 'Connection test successful',
        };
      } else {
        return {
          success: false,
          message: 'Connection test failed',
          error: testResult.error,
        };
      }
    } catch (error) {
      // Update environment status if it exists
      const environment = await this.findByWorkspace(workspaceId);
      if (environment) {
        await this.environmentRepository.update(environment.id, {
          connectionStatus: 'failed',
          lastTestedAt: new Date(),
        });
      }

      return {
        success: false,
        message: 'Connection test failed',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Mock connection test - replace with actual MS SQL implementation
  private mockConnectionTest(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    connectionTimeout: number;
    encrypt: boolean;
  }): boolean {
    // This is a placeholder implementation
    // In a real scenario, you would use the 'mssql' package to test the connection
    // For now, we'll just validate the basic format

    if (!config.host || config.port <= 0 || config.port > 65535) {
      return false;
    }

    if (!config.username || !config.password || !config.database) {
      return false;
    }

    // Simulate connection test with basic validation
    // In production, replace with actual MS SQL connection test using mssql package
    return true;
  }

  async canUserAccessEnvironment(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    return !!member;
  }

  async canUserEditEnvironment(
    workspaceId: string,
    userId: string
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId, isActive: true },
    });

    if (!member) {
      return false;
    }

    const allowedRoles = [WorkspaceRole.OWNER, WorkspaceRole.AUTHOR];
    return allowedRoles.includes(member.role);
  }
}

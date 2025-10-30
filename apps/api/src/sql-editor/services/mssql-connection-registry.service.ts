import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EnvironmentService } from '../../workspaces/environment.service';
import { WorkspaceConnectionManager } from '../../workspaces/connection-manager.service';

@Injectable()
export class MssqlConnectionRegistry {
  private readonly logger = new Logger(MssqlConnectionRegistry.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly connectionManager: WorkspaceConnectionManager
  ) {}

  async getConnectionForWorkspace(workspaceId: string): Promise<DataSource> {
    this.logger.debug(`Getting MSSQL connection for workspace: ${workspaceId}`);

    const environment =
      await this.environmentService.findByWorkspace(workspaceId);
    if (!environment) {
      throw new Error(
        `No environment configuration found for workspace: ${workspaceId}`
      );
    }

    try {
      return await this.connectionManager.getConnection(
        workspaceId,
        environment
      );
    } catch (error) {
      this.logger.error(
        `Failed to get MSSQL connection for workspace ${workspaceId}:`,
        error
      );
      throw new Error(
        `Failed to connect to workspace database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnectionForWorkspace(
    workspaceId: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    this.logger.debug(`Testing MSSQL connection for workspace: ${workspaceId}`);

    const environment =
      await this.environmentService.findByWorkspace(workspaceId);
    if (!environment) {
      return {
        success: false,
        message: 'No environment configuration found for this workspace',
      };
    }

    try {
      const testResult = await this.connectionManager.testConnection({
        host: environment.host,
        port: environment.port,
        username: environment.username,
        password: environment.password,
        database: environment.database,
        connectionTimeout: environment.connectionTimeout,
        encrypt: environment.encrypt,
      });

      if (testResult.success) {
        return {
          success: true,
          message: 'MSSQL connection test successful',
        };
      } else {
        return {
          success: false,
          message: 'MSSQL connection test failed',
          error: testResult.error,
        };
      }
    } catch (error) {
      this.logger.error(
        `MSSQL connection test failed for workspace ${workspaceId}:`,
        error
      );
      return {
        success: false,
        message: 'MSSQL connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refreshConnectionForWorkspace(
    workspaceId: string
  ): Promise<DataSource> {
    this.logger.debug(
      `Refreshing MSSQL connection for workspace: ${workspaceId}`
    );

    const environment =
      await this.environmentService.findByWorkspace(workspaceId);
    if (!environment) {
      throw new Error(
        `No environment configuration found for workspace: ${workspaceId}`
      );
    }

    try {
      return await this.connectionManager.refreshConnection(
        workspaceId,
        environment
      );
    } catch (error) {
      this.logger.error(
        `Failed to refresh MSSQL connection for workspace ${workspaceId}:`,
        error
      );
      throw new Error(
        `Failed to refresh workspace database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async canWorkspaceConnect(workspaceId: string): Promise<boolean> {
    try {
      const testResult = await this.testConnectionForWorkspace(workspaceId);
      return testResult.success;
    } catch (error) {
      this.logger.warn(
        `Error checking workspace connectivity for ${workspaceId}:`,
        error
      );
      return false;
    }
  }
}

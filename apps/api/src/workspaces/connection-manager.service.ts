import { Injectable, Logger } from '@nestjs/common';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Environment } from '../workspaces/entities/environment.entity';

export interface WorkspaceConnection {
  dataSource: DataSource;
  lastUsed: Date;
  isActive: boolean;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionTimeout?: number;
  encrypt?: boolean;
}

@Injectable()
export class WorkspaceConnectionManager {
  private readonly logger = new Logger(WorkspaceConnectionManager.name);
  private readonly connections = new Map<string, WorkspaceConnection>();
  private readonly maxConnections = 50; // System-wide limit
  private readonly connectionTimeout = 30 * 60 * 1000; // 30 minutes idle timeout
  private readonly healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  async getConnection(workspaceId: string, environment: Environment): Promise<DataSource> {
    const connectionKey = workspaceId;

    // Check if connection already exists and is active
    const existingConnection = this.connections.get(connectionKey);
    if (existingConnection && existingConnection.isActive) {
      existingConnection.lastUsed = new Date();
      
      // Test if connection is still valid
      if (await this.isConnectionHealthy(existingConnection.dataSource)) {
        return existingConnection.dataSource;
      } else {
        // Connection is unhealthy, remove it
        await this.removeConnection(connectionKey);
      }
    }

    // Check connection limit
    if (this.connections.size >= this.maxConnections) {
      await this.cleanupIdleConnections();
      
      if (this.connections.size >= this.maxConnections) {
        throw new Error('Maximum workspace connections reached');
      }
    }

    // Create new connection
    const connectionConfig = this.buildConnectionConfig(environment);
    const dataSource = new DataSource(connectionConfig);

    try {
      await dataSource.initialize();
      this.logger.log(`Created new database connection for workspace: ${workspaceId}`);

      const workspaceConnection: WorkspaceConnection = {
        dataSource,
        lastUsed: new Date(),
        isActive: true,
      };

      this.connections.set(connectionKey, workspaceConnection);
      return dataSource;
    } catch (error) {
      this.logger.error(`Failed to create connection for workspace ${workspaceId}:`, error);
      throw new Error(`Failed to connect to workspace database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const connectionConfig = this.buildConnectionConfigFromConfig(config);
      const dataSource = new DataSource(connectionConfig);

      // Try to initialize the connection
      await dataSource.initialize();
      
      // Simple query to test connectivity
      await dataSource.query('SELECT 1');
      
      // Clean up test connection
      await dataSource.destroy();
      
      return { success: true };
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async removeConnection(workspaceId: string): Promise<void> {
    const connection = this.connections.get(workspaceId);
    if (connection) {
      try {
        connection.isActive = false;
        await connection.dataSource.destroy();
        this.connections.delete(workspaceId);
        this.logger.log(`Removed connection for workspace: ${workspaceId}`);
      } catch (error) {
        this.logger.error(`Error removing connection for workspace ${workspaceId}:`, error);
      }
    }
  }

  async refreshConnection(workspaceId: string, environment: Environment): Promise<DataSource> {
    await this.removeConnection(workspaceId);
    return this.getConnection(workspaceId, environment);
  }

  private buildConnectionConfig(environment: Environment): DataSourceOptions {
    return {
      type: 'mssql' as any,
      host: environment.host,
      port: environment.port,
      username: environment.username,
      password: environment.password,
      database: environment.database,
      options: {
        trustServerCertificate: !environment.encrypt,
        connectionTimeout: environment.connectionTimeout || 30000,
        requestTimeout: environment.connectionTimeout || 30000,
      } as any,
      // Don't synchronize or run migrations on workspace databases
      synchronize: false,
      migrationsRun: false,
      logging: false, // Don't log workspace database queries
    };
  }

  private buildConnectionConfigFromConfig(config: ConnectionConfig): DataSourceOptions {
    return {
      type: 'mssql' as any,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      options: {
        trustServerCertificate: !config.encrypt,
        connectionTimeout: config.connectionTimeout || 30000,
        requestTimeout: config.connectionTimeout || 30000,
      } as any,
      synchronize: false,
      migrationsRun: false,
      logging: false,
    };
  }

  private async isConnectionHealthy(dataSource: DataSource): Promise<boolean> {
    try {
      if (!dataSource.isInitialized) {
        return false;
      }

      // Simple health check query
      await dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.warn('Connection health check failed:', error);
      return false;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const now = new Date();
    const connectionsToRemove: string[] = [];

    for (const [workspaceId, connection] of this.connections) {
      // Check if connection is idle
      const idleTime = now.getTime() - connection.lastUsed.getTime();
      if (idleTime > this.connectionTimeout) {
        connectionsToRemove.push(workspaceId);
        continue;
      }

      // Check connection health
      const isHealthy = await this.isConnectionHealthy(connection.dataSource);
      if (!isHealthy) {
        connectionsToRemove.push(workspaceId);
      }
    }

    // Remove unhealthy or idle connections
    for (const workspaceId of connectionsToRemove) {
      await this.removeConnection(workspaceId);
    }

    if (connectionsToRemove.length > 0) {
      this.logger.log(`Cleaned up ${connectionsToRemove.length} workspace connections`);
    }
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    const connectionsByLastUsed = Array.from(this.connections.entries())
      .sort(([, a], [, b]) => a.lastUsed.getTime() - b.lastUsed.getTime());

    // Remove idle connections first
    for (const [workspaceId, connection] of connectionsByLastUsed) {
      const idleTime = now.getTime() - connection.lastUsed.getTime();
      if (idleTime > this.connectionTimeout / 2) { // Remove connections idle for more than 15 minutes
        await this.removeConnection(workspaceId);
        if (this.connections.size < this.maxConnections) {
          break;
        }
      }
    }
  }

  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    connectionDetails: Array<{ workspaceId: string; lastUsed: Date; isActive: boolean }>;
  } {
    const connectionDetails = Array.from(this.connections.entries()).map(([workspaceId, connection]) => ({
      workspaceId,
      lastUsed: connection.lastUsed,
      isActive: connection.isActive,
    }));

    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values()).filter(c => c.isActive).length,
      connectionDetails,
    };
  }

  async shutdown(): Promise<void> {
    this.logger.log('Shutting down all workspace connections...');
    
    const shutdownPromises = Array.from(this.connections.entries()).map(
      async ([workspaceId]) => this.removeConnection(workspaceId)
    );

    await Promise.all(shutdownPromises);
    this.logger.log('All workspace connections shut down');
  }
}
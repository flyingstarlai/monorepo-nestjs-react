import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';

type DatabaseType = 'postgres' | 'mssql';

const getDatabaseType = (): DatabaseType => {
  const dbType = process.env.DB_TYPE?.toLowerCase();
  return dbType === 'postgres' ? 'postgres' : 'mssql';
};

const getMigrationsPath = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const migrationsBaseDir = path.join(__dirname, '..', 'migrations');
  const ext = isProduction ? '*.js' : '*.ts';
  const dbType = getDatabaseType();

  // Use appropriate migration directory based on database type
  return [path.join(migrationsBaseDir, dbType, ext)];
};

const buildDatabaseOptions = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const loggingEnv = process.env.TYPEORM_LOGGING;
  const logging =
    loggingEnv !== undefined ? loggingEnv === 'true' : !isProduction;

  const dbType = getDatabaseType();
  
  // Default values based on database type
  const defaults = dbType === 'postgres' 
    ? {
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres123',
        database: 'dashboard',
      }
    : {
        host: 'localhost',
        port: 1433,
        username: 'sa',
        password: 'YourStrong!Passw0rd',
        database: 'dashboard',
      };

  const host = process.env.DB_HOST || defaults.host;
  const port = parseInt(process.env.DB_PORT || defaults.port.toString(), 10);
  const username = process.env.DB_USERNAME || defaults.username;
  const password = process.env.DB_PASSWORD || defaults.password;
  const database = process.env.DB_DATABASE || defaults.database;

  const baseOptions = {
    entities: [User, Role, Activity, Workspace, WorkspaceMember],
    synchronize: false,
    migrations: getMigrationsPath(),
    migrationsRun: true,
    logging,
  };

  if (dbType === 'postgres') {
    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      ...baseOptions,
    };
  } else {
    return {
      type: 'mssql' as any,
      host,
      port,
      username,
      password,
      database,
      ...baseOptions,
      options: {
        trustServerCertificate: true,
      } as any,
    };
  }
};

export const databaseConfig = buildDatabaseOptions();

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  ...buildDatabaseOptions(),
});

export const getDataSourceOptions = (): DataSourceOptions => ({
  ...(buildDatabaseOptions() as DataSourceOptions),
});

export const dataSource = new DataSource(getDataSourceOptions());

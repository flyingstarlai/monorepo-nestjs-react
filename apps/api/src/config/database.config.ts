import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';

const getMigrationsPath = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const migrationsBaseDir = path.join(__dirname, '..', 'migrations');
  const ext = isProduction ? '*.js' : '*.ts';

  // Only MSSQL migrations are used; Postgres is no longer supported
  return [path.join(migrationsBaseDir, 'mssql', ext)];
};

const buildDatabaseOptions = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const loggingEnv = process.env.TYPEORM_LOGGING;
  const logging =
    loggingEnv !== undefined ? loggingEnv === 'true' : !isProduction;

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '1433', 10);
  const username = process.env.DB_USERNAME || 'sa';
  const password = process.env.DB_PASSWORD || 'YourStrong!Passw0rd';
  const database = process.env.DB_DATABASE || 'dashboard';

  return {
    type: 'mssql' as any,
    host,
    port,
    username,
    password,
    database,
    entities: [User, Role, Activity, Workspace, WorkspaceMember],
    synchronize: false,
    migrations: getMigrationsPath(),
    migrationsRun: true,
    logging,
    options: {
      trustServerCertificate: true,
    } as any,
  };
};

export const databaseConfig = buildDatabaseOptions();

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  ...buildDatabaseOptions(),
});

export const getDataSourceOptions = (): DataSourceOptions => ({
  ...(buildDatabaseOptions() as DataSourceOptions),
});

export const dataSource = new DataSource(getDataSourceOptions());

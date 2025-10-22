import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'node:path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

const getMigrationsPath = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  return [
    path.join(migrationsDir, isProduction ? '*.js' : '*.ts'),
  ];
};

const buildDatabaseOptions = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const loggingEnv = process.env.TYPEORM_LOGGING;
  const logging =
    loggingEnv !== undefined ? loggingEnv === 'true' : !isProduction;

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'dashboard',
    password: process.env.DB_PASSWORD || 'dashboard123',
    database: process.env.DB_DATABASE || 'dashboard',
    entities: [User, Role, Activity],
    synchronize: false,
    migrations: getMigrationsPath(),
    migrationsRun: true,
    logging,
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

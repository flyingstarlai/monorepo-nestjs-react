import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: './data.sqlite',
  entities: [User, Role, Activity],
  synchronize: true,
  logging: true,
};

export const dataSource = new DataSource(databaseConfig as DataSourceOptions);

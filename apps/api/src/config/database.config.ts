import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: './data.sqlite',
  entities: [User, Role],
  synchronize: true,
  logging: true,
};

export const dataSource = new DataSource(databaseConfig as DataSourceOptions);

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: './data.sqlite',
  entities: [User, Role],
  synchronize: true,
  logging: true,
};

export const dataSource = new DataSource(databaseConfig as DataSourceOptions);

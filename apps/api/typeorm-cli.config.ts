import { DataSource } from 'typeorm';
import { Activity } from './src/activities/entities/activity.entity';
import { Role } from './src/users/entities/role.entity';
import { User } from './src/users/entities/user.entity';
import { Workspace } from './src/workspaces/entities/workspace.entity';
import { WorkspaceMember } from './src/workspaces/entities/workspace-member.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres101',
  database: 'tc_studio',
  entities: [User, Role, Activity, Workspace, WorkspaceMember],
  migrations: ['src/migrations/postgres/*.ts'],
  synchronize: false,
  logging: true,
});
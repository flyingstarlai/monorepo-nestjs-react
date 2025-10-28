import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum ActivityScope {
  USER = 'user',
  WORKSPACE = 'workspace',
}

export enum ActivityType {
  // User activity types
  LOGIN_SUCCESS = 'login_success',
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed',
  AVATAR_UPDATED = 'avatar_updated',
  USER_CREATED = 'user_created',
  // Workspace lifecycle events
  WORKSPACE_CREATED = 'workspace_created',
  WORKSPACE_UPDATED = 'workspace_updated',
  WORKSPACE_DEACTIVATED = 'workspace_deactivated',
  WORKSPACE_ACTIVATED = 'workspace_activated',
  // Membership lifecycle events
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  MEMBER_ROLE_CHANGED = 'member_role_changed',
  MEMBER_STATUS_CHANGED = 'member_status_changed',
}

@Entity('activities')
@Index(['ownerId', 'createdAt'])
@Index(['workspaceId', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspace, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;

  @Column({
    type: 'varchar',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({
    type: 'varchar',
    enum: ActivityScope,
    default: ActivityScope.USER,
  })
  scope: ActivityScope;

  @Column()
  message: string;

  // Use jsonb for PostgreSQL, simple-json for MSSQL
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

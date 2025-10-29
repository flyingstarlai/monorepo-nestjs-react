import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @Column({ nullable: true, type: 'text' })
  avatar: string;

  @Column({ nullable: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 50 })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ name: 'date_of_birth', nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_active_workspace_id', nullable: true })
  lastActiveWorkspaceId: string | null;

  @Column({ name: 'last_active_workspace_at', nullable: true })
  lastActiveWorkspaceAt: Date | null;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'last_active_workspace_id' })
  lastActiveWorkspace?: Workspace | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoredProcedure } from './stored-procedure.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum StoredProcedureVersionSource {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('stored_procedure_versions')
@Index(['procedureId', 'version'], { unique: true })
@Index(['procedureId'])
@Index(['workspaceId'])
export class StoredProcedureVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'procedure_id' })
  procedureId: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'enum', enum: StoredProcedureVersionSource })
  source: StoredProcedureVersionSource;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'sql_text', type: 'text' })
  sqlText: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => StoredProcedure, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'procedure_id' })
  procedure: StoredProcedure;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
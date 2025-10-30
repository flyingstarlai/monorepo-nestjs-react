import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum StoredProcedureStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('stored_procedures')
@Index(['workspaceId'])
@Index(['updatedAt'])
export class StoredProcedure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: StoredProcedureStatus,
    default: StoredProcedureStatus.DRAFT,
  })
  status: StoredProcedureStatus;

  @Column({ name: 'sql_draft', type: 'text' })
  sqlDraft: string;

  @Column({ name: 'sql_published', type: 'text', nullable: true })
  sqlPublished: string | null;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}

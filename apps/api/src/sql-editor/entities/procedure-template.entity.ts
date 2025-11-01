import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface TemplateParameter {
  name: string;
  type: 'identifier' | 'string' | 'number';
  required: boolean;
  default?: any;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface TemplateParamsSchema {
  [key: string]: TemplateParameter;
}

@Entity('procedure_templates')
@Index(['createdBy'])
@Unique(['name'])
export class ProcedureTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'sql_template', type: 'text' })
  sqlTemplate: string;

  @Column({ name: 'params_schema', type: 'jsonb', nullable: true })
  paramsSchema: TemplateParamsSchema | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
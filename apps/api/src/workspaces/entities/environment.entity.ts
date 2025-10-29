import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workspace } from './workspace.entity';

@Entity('environments')
export class Environment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Workspace, { nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  database: string;

  @Column({ name: 'connection_timeout', nullable: true })
  connectionTimeout: number;

  @Column({ name: 'encrypt', default: false })
  encrypt: boolean;

  @Column({ name: 'connection_status', default: 'unknown' })
  connectionStatus: string;

  @Column({ name: 'last_tested_at', nullable: true })
  lastTestedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
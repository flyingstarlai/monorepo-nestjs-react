import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityType {
  LOGIN_SUCCESS = 'login_success',
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed',
  AVATAR_UPDATED = 'avatar_updated',
}

@Entity('activities')
@Index(['ownerId', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({
    type: 'varchar',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column()
  message: string;

  // Use simple-json for cross-dialect compatibility (MSSQL has no native JSON type)
  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'datetime2', default: () => 'SYSDATETIME()' })
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['action', 'timestamp'])
@Index(['targetType', 'target'])
@Index(['studentId', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  mongoId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @Column({ type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  actorEmail: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  target: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  targetType: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  studentId?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  attemptId?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assessmentId?: string;

  @Column({ type: 'varchar', length: 255, default: '', nullable: true })
  event?: string;

  @Column({ type: 'int', default: 0 })
  riskWeight: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  ipAddress: string;

  @Column({ type: 'text', default: '' })
  userAgent: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}

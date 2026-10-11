import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Assessment } from './assessment.entity';

@Entity('exam_sessions')
@Index(['assessmentId', 'candidateId'], { unique: true })
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @ManyToOne(() => Assessment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ name: 'assessment_id' })
  assessmentId: string;

  get assessment_id(): string {
    return this.assessmentId;
  }
  set assessment_id(val: string) {
    this.assessmentId = val;
  }

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  get candidate_id(): string {
    return this.candidateId;
  }
  set candidate_id(val: string) {
    this.candidateId = val;
  }

  @Column({ default: 'CREATED' })
  status: string;

  @Column({ default: 'DISABLED' })
  secureMode: string;

  @Column()
  clientType: string;

  @Column({ nullable: true })
  clientVersion: string;

  @Column({ nullable: true })
  configKey: string;

  @Column({ nullable: true })
  browserExamKeyVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeatAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ default: 'CLEAN' })
  securityState: string;

  @Column({ default: 0 })
  violationCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

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
import { ExamSession } from './exam-session.entity';

@Entity('exam_security_events')
export class ExamSecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @ManyToOne(() => ExamSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'session_id' })
  @Index()
  session: ExamSession;

  @Column({ name: 'session_id' })
  sessionId: string;

  get session_id(): string {
    return this.sessionId;
  }
  set session_id(val: string) {
    this.sessionId = val;
  }

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'candidate_id' })
  @Index()
  candidate: User;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  get candidate_id(): string {
    return this.candidateId;
  }
  set candidate_id(val: string) {
    this.candidateId = val;
  }

  @ManyToOne(() => Assessment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assessment_id' })
  @Index()
  assessment: Assessment;

  @Column({ name: 'assessment_id' })
  assessmentId: string;

  get assessment_id(): string {
    return this.assessmentId;
  }
  set assessment_id(val: string) {
    this.assessmentId = val;
  }

  @Column()
  eventType: string;

  @Column({ default: 'INFO' })
  severity: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

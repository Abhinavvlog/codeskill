import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('email_jobs')
@Index(['status', 'createdAt'])
@Index(['student_id', 'status'])
@Index(['uid', 'status'])
export class EmailJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column()
  student_id: string;

  @Column()
  uid: string;

  @Column()
  email: string;

  @Column()
  name: string;

  /**
   * AUD-037: Stores the plaintext temporary password ONLY until it has been
   * delivered via the credential email. The processor clears this field to
   * an empty string after the email is sent, ensuring it is not retained
   * long-term. This column must NEVER be included in any public API response.
   */
  @Column({ nullable: true, select: false })
  temporaryPassword?: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'text', default: '' })
  error?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('discussions')
@Index(['problemId', 'createdAt'])
@Index(['problemId', 'upvotes'])
export class Discussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @Column()
  @Index()
  problemId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true })
  author_id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 5000 })
  body: string;

  @Column({ type: 'jsonb', default: ['general'] })
  tags: string[];

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column('text', { array: true, default: '{}' })
  upvotedBy: string[];

  @Column('text', { array: true, default: '{}' })
  downvotedBy: string[];

  @Column({ default: 0 })
  replyCount: number;

  @Column({ default: false })
  isPinned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

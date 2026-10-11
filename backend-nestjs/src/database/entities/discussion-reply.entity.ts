import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Discussion } from './discussion.entity';

@Entity('discussion_replies')
@Index(['discussion_id', 'createdAt'])
export class DiscussionReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @ManyToOne(() => Discussion, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Discussion;

  @Column()
  discussion_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true })
  author_id: string;

  @Column({ length: 3000 })
  body: string;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

  @Column('text', { array: true, default: '{}' })
  upvotedBy: string[];

  @Column('text', { array: true, default: '{}' })
  downvotedBy: string[];

  @ManyToOne(() => DiscussionReply, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_reply_id' })
  parentReply: DiscussionReply;

  @Column({ nullable: true })
  parent_reply_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

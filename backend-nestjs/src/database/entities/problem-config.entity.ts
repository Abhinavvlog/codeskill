import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ProblemMetadata } from './problem-metadata.entity';

@Entity('problem_configs')
export class ProblemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mongoId: string;

  @OneToOne(() => ProblemMetadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'metadata_id' })
  metadata: ProblemMetadata;

  @Column()
  metadata_id: string;

  @Column({ type: 'jsonb', default: [] })
  supportedLanguages: string[];

  @Column({ default: 2000 })
  timeLimit: number;

  @Column({ default: 256 })
  memoryLimit: number;

  @Column({ default: 1 })
  cpuLimit: number;

  @Column({ default: 8 })
  stackSize: number;

  @Column({ default: 10 })
  outputLimit: number;

  @Column({ default: 1048576 }) // 1024 * 1024
  maxSourceCodeSize: number;

  @Column({ default: 'standard' })
  executionMode: string;

  @Column({ type: 'jsonb', nullable: true })
  functionSignature: any;

  @Column({ default: false })
  exactOutput: boolean;

  @Column({ default: true })
  enableCustomInput: boolean;

  @Column({ default: false })
  allowMultipleFiles: boolean;

  @Column({ default: false })
  enableFileUpload: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  defaultLanguage?: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  starterCode: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  referenceSolution: Record<string, string>;

  @Column({ default: false })
  hasCustomChecker: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customCheckerCode: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

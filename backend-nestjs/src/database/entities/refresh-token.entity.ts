import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Server-side record of an issued refresh token. Only a SHA-256 digest of the
 * opaque token is stored, so a database leak does not yield usable tokens.
 * Tokens rotate on every use; presenting an already-rotated token revokes the
 * whole `familyId` (reuse detection).
 */
@Entity('refresh_tokens')
@Index(['userId'])
@Index(['familyId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'uuid' })
  familyId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replacedById: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

import { MigrationQueryRunner } from './declarative-partitioning';

export async function applyAssessmentProctorCapturesMigration(
  queryRunner: MigrationQueryRunner,
): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "assessment_attempts"
      ADD COLUMN IF NOT EXISTS "captures" jsonb NOT NULL DEFAULT '[]'::jsonb;
  `);
}

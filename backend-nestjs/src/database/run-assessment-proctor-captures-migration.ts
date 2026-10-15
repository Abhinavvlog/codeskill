import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { practiceSubmissionMigrationOptions } from './run-practice-submission-source';
import { applyAssessmentProctorCapturesMigration } from './migrations/assessment-proctor-captures';

async function run(): Promise<void> {
  const dataSource = new DataSource(practiceSubmissionMigrationOptions());
  try {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await applyAssessmentProctorCapturesMigration(queryRunner);
    } finally {
      await queryRunner.release();
    }
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void run()
  .then(() => console.log('Assessment proctor capture migration completed.'))
  .catch((error) => {
    console.error('Assessment proctor capture migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });

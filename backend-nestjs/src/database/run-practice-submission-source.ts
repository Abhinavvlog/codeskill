import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../config';
import { applyPracticeSubmissionSourceMigration } from './migrations/practice-submission-source';
import { applyAuthTokensSchemaMigration } from './migrations/auth-tokens-schema';
import { applyDeclarativePartitioningMigration } from './migrations/declarative-partitioning';

export function practiceSubmissionMigrationOptions(): DataSourceOptions {
  const postgres = databaseConfig().postgres;
  const common = {
    type: 'postgres' as const,
    synchronize: false,
    logging: false,
  };

  if (postgres.url) {
    return { ...common, url: postgres.url };
  }

  return {
    ...common,
    host: postgres.host,
    port: postgres.port,
    username: postgres.username,
    password: postgres.password,
    database: postgres.database,
    ssl: postgres.ssl ? { rejectUnauthorized: false } : false,
  };
}

export async function runPracticeSubmissionSourceMigration(): Promise<void> {
  const dataSource = new DataSource(practiceSubmissionMigrationOptions());

  try {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await applyPracticeSubmissionSourceMigration(queryRunner);
        await applyAuthTokensSchemaMigration(queryRunner);
        await applyDeclarativePartitioningMigration(queryRunner);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runPracticeSubmissionSourceMigration()
    .then(() => {
      console.log('Practice submission source migration completed.');
    })
    .catch(() => {
      // Connection errors can contain credentials; keep CLI output generic.
      console.error(
        'Practice submission source migration failed. Check database connectivity and the submissions schema.',
      );
      process.exitCode = 1;
    });
}

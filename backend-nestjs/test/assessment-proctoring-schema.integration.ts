// All DDL/data are session-local temporary tables, rolled back on completion.
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { applyAssessmentProctoringModesMigration } from '../src/database/migrations/assessment-proctoring-modes';
const { Client } = require('pg');

async function main() {
  const env = parse(readFileSync(resolve(__dirname, '../.env')));
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!connectionString || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(connectionString).hostname))
    throw new Error('This check requires a local PostgreSQL DATABASE_URL');
  const db = new Client({ connectionString });
  await db.connect();
  try {
    await db.query('BEGIN');
    try {
      await db.query(`CREATE TEMP TABLE assessments (
        id int PRIMARY KEY, code text UNIQUE, proctoring jsonb NOT NULL DEFAULT '{}') ON COMMIT DROP`);
      await db.query(`CREATE TEMP TABLE assessment_attempts (
        id int PRIMARY KEY, score double precision NOT NULL DEFAULT 0) ON COMMIT DROP`);
      await db.query(`INSERT INTO pg_temp.assessments VALUES
        (1,'FULL','{}'), (2,'PARTIAL','{"mode":"partial_proctored"}'),
        (3,'OPEN','{"mode":"non_proctored"}'), (4,'INVALID','{"mode":"unknown"}')`);
      await db.query('INSERT INTO pg_temp.assessment_attempts VALUES (1, 7.5)');

      await db.query('SAVEPOINT missing_mode');
      await assert.rejects(
        db.query('SELECT "Assessment"."mode" FROM pg_temp.assessments "Assessment" WHERE code=$1', ['FULL']),
        /WITHIN GROUP is required for ordered-set aggregate mode/,
      );
      await db.query('ROLLBACK TO SAVEPOINT missing_mode');

      const runner = { query: async (sql: string) => (await db.query(sql)).rows };
      await applyAssessmentProctoringModesMigration(runner);
      const assessments = (await db.query('SELECT "mode", "submissionPolicy" FROM pg_temp.assessments ORDER BY id')).rows;
      assert.deepEqual(assessments, [
        { mode: 'fully_proctored', submissionPolicy: 'auto' },
        { mode: 'partial_proctored', submissionPolicy: 'manual' },
        { mode: 'non_proctored', submissionPolicy: 'manual' },
        { mode: 'fully_proctored', submissionPolicy: 'auto' },
      ]);
      const attempt = (await db.query('SELECT * FROM pg_temp.assessment_attempts')).rows[0];
      assert.equal(attempt.score, 7.5);
      assert.equal(attempt.rawScore, 7.5);
      assert.equal(attempt.proctoringPenalty, 0);
      assert.equal(attempt.mode, null);
      assert.equal(attempt.submissionPolicy, null);

      await db.query('UPDATE pg_temp.assessments SET "mode"=$1,"submissionPolicy"=$2 WHERE id=1', ['non_proctored', 'manual']);
      await db.query('UPDATE pg_temp.assessment_attempts SET "rawScore"=12,"proctoringPenalty"=4,"mode"=$1,"submissionPolicy"=$2', ['partial_proctored', 'manual']);
      await applyAssessmentProctoringModesMigration(runner);
      const repeated = (await db.query('SELECT * FROM pg_temp.assessment_attempts')).rows[0];
      assert.equal(repeated.rawScore, 12);
      assert.equal(repeated.proctoringPenalty, 4);
      assert.equal(repeated.score, 7.5);
      assert.equal(repeated.mode, 'partial_proctored');
      assert.equal(repeated.submissionPolicy, 'manual');
      assert.equal((await db.query('SELECT "mode" FROM pg_temp.assessments WHERE id=1')).rows[0].mode, 'non_proctored');
      await db.query('INSERT INTO pg_temp.assessments(id,code) VALUES (5,$1)', ['NEW']);
      const created = (await db.query('SELECT "mode","submissionPolicy" FROM pg_temp.assessments WHERE code=$1', ['NEW'])).rows[0];
      assert.deepEqual(created, { mode: 'fully_proctored', submissionPolicy: 'auto' });
      console.log('PASS exact mode error reproduction, assessment creation/read, six-column migration, legacy mode/score preservation and safe reruns.');
    } finally {
      await db.query('ROLLBACK');
    }
  } finally {
    await db.end();
  }
}
main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });

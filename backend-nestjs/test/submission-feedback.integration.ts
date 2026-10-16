// Uses session-local temporary tables; never writes application data.
import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
const { Client } = require('pg');
import { SubmissionStore } from '../src/database/sharding/submission-store';
import { AssessmentsService } from '../src/assessments/assessments.service';

async function main() {
  const settings = parse(readFileSync(resolve(__dirname, '../.env')));
  const connectionString = process.env.DATABASE_URL || settings.DATABASE_URL;
  if (
    !connectionString ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(
      new URL(connectionString).hostname,
    )
  )
    throw new Error('This check requires a local PostgreSQL DATABASE_URL');
  const db = new Client({ connectionString });
  await db.connect();
  try {
    await db.query(`CREATE TEMP TABLE submissions (
      "problemId" text, "problemSource" text, "userId" text, language text, status text,
      "totalTestCases" int, "totalTests" int, runtime double precision, "executionTime" double precision,
      memory double precision, "memoryUsed" double precision)`);
    await db.query(`INSERT INTO submissions ("problemId", "problemSource", "userId", language, status, "totalTestCases", runtime, memory)
      VALUES ('p','metadata','self','python','accepted',5,1,1),
      ('p','metadata','a','python','accepted',5,20,128), ('p','metadata','a','python','accepted',5,30,256),
      ('p','metadata','b','py','accepted',5,5,32), ('p','metadata','c','java','accepted',5,100,200),
      ('p','metadata','d','python','wrong_answer',5,100,200), ('p','metadata','e','python','accepted',6,100,200),
      ('p','question','f','python','accepted',5,100,200)`);
    const query = async (sql: string, parameters: any[]) =>
      (await db.query(sql, parameters)).rows;
    const store = new SubmissionStore(
      { query } as never,
      {} as never,
      { enabled: false } as never,
    );
    const comparison = await store.performanceComparison(
      {
        problemId: 'p',
        problemSource: 'metadata',
        userId: 'self',
        totalTestCases: 5,
        runtime: 10,
        memory: 64,
      } as never,
      ['python', 'python3', 'py'],
    );
    assert.deepEqual(comparison, {
      runtime: { percentile: 50, sampleSize: 2 },
      memory: { percentile: 50, sampleSize: 2 },
    });

    await db.query(`CREATE TEMP TABLE assessment_attempts (
      assessment_id text, student_id text, status text, "submittedAt" timestamp, responses jsonb)`);
    for (const [student, passed, submitted, status, total] of [
      ['self', 0, '2026-01-01', 'submitted', 2],
      ['a', 0, '2026-01-01', 'submitted', 2],
      ['a', 2, '2026-01-02', 'submitted', 2],
      ['b', 1, '2026-01-01', 'auto_submitted', 2],
      ['c', 0, '2026-01-01', 'in_progress', 2],
      ['d', 0, '2026-01-01', 'submitted', 9],
    ])
      await db.query(
        'INSERT INTO assessment_attempts VALUES ($1,$2,$3,$4,$5)',
        [
          'exam',
          student,
          status,
          submitted,
          JSON.stringify([
            { questionId: 'q', testCasesPassed: passed, totalTestCases: total },
          ]),
        ],
      );
    let jobData: any;
    const service = new AssessmentsService(
      {
        findOne: async () => ({
          id: 'exam',
          status: 'published',
          questions: ['q'],
          durationMinutes: 60,
        }),
      } as never,
      {
        findOne: async () => ({ studentId: 'self', startedAt: new Date() }),
        query,
      } as never,
      {
        findOne: async () => ({
          id: 'q',
          questionType: 'dsa',
          testCases: [
            { input: 'sample', expectedOutput: 'sample' },
            { input: 'secret', expectedOutput: 'secret', isHidden: true },
          ],
        }),
      } as never,
      {} as never,
      { validateRequest: () => {} } as never,
      { reserve: async () => 'lease' } as never,
      {
        getJobCounts: async () => ({ waiting: 0 }),
        add: async (_name: string, data: any) => {
          jobData = data;
          return { id: 'lease' };
        },
      } as never,
    );
    (service as any).isStudentTargeted = () => true;
    const response = await service.evaluateCode(
      'exam',
      { questionId: 'q', code: 'print(input())', language: 'python' },
      { id: 'self' },
    );
    assert.equal(JSON.stringify(response).includes('secret'), false);
    assert.deepEqual(
      jobData.peerScores.sort((a: any, b: any) => a.passed - b.passed),
      [
        { passed: 1, count: 1 },
        { passed: 2, count: 1 },
      ],
    );
    console.log(
      'PASS PostgreSQL feedback queries: unique peers, language/test/source scope, latest graded attempts, own-candidate exclusion',
    );
  } finally {
    await db.end(); // PostgreSQL drops both session-local temporary tables.
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

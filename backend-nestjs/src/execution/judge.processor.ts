import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionService } from './execution.service';
import { Submission } from '../database/entities/submission.entity';
import { ProblemMetadata } from '../database/entities/problem-metadata.entity';
import { ProblemTestCase } from '../database/entities/problem-testcase.entity';
import { Problem } from '../database/entities/problem.entity';
import { User } from '../database/entities/user.entity';
import { AppGateway } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';
import { Status } from './execution.types';
import * as os from 'os';

export enum SubmissionStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  TESTING = 'testing',
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  SYSTEM_ERROR = 'system_error',
}

const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 10;

@Processor('submissions', { concurrency: WORKER_CONCURRENCY })
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);
  private readonly runnerId =
    process.env.RUNNER_ID || `runner-${os.hostname()}-${process.pid}`;

  constructor(
    private readonly executionService: ExecutionService,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(ProblemMetadata)
    private readonly problemModel: Repository<ProblemMetadata>,
    @InjectRepository(ProblemTestCase)
    private readonly testCaseModel: Repository<ProblemTestCase>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly appGateway: AppGateway,
    private readonly redisService: RedisService,
  ) {
    super();
    this.logger.log(
      `JudgeProcessor initialized on runner: ${this.runnerId} (concurrency: ${WORKER_CONCURRENCY})`,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[Judge:${this.runnerId}] Processing job ${job.id} — type: ${job.name}`,
    );

    if (job.name === 'run-code') {
      const { code, language, testCases, config = {}, userId } = job.data;
      if (userId) {
        this.appGateway.emitToUser(userId, 'run_status', {
          jobId: job.id,
          status: 'running',
          message: `Running code in isolated container sandbox...`,
        });
      }

      const results = await this.executionService.executeCode(
        language,
        code,
        testCases,
        config,
      );
      const passedCount = results.filter((result) => result.passed).length;
      const status = this.overallStatus(results);

      const payload = {
        success: true,
        status,
        results,
        runtime: results.reduce(
          (total, result) => total + (result.executionTime || 0),
          0,
        ),
        passedCount,
        totalCount: results.length,
      };

      if (userId) {
        this.appGateway.emitToUser(userId, 'run_complete', {
          jobId: job.id,
          ...payload,
        });
      }

      return payload;
    }

    if (job.name === 'evaluate-code') {
      const { submissionId, problemId, code, language, userId } = job.data;

      try {
        // 1. Mark as running in DB
        const submission = await this.submissionRepo.findOne({
          where: [{ id: submissionId }, { mongoId: submissionId }],
        });

        if (submission) {
          submission.status = SubmissionStatus.RUNNING;
          submission.startedAt = new Date();
          await this.submissionRepo.save(submission);
        }

        this.appGateway.emitToUser(userId, 'submission_status', {
          submissionId,
          status: SubmissionStatus.RUNNING,
          message: `Worker picked up submission on ${this.runnerId}`,
        });

        // 2. Fetch actual test cases from DB
        let testCases: any[] = [];
        const testCaseDoc = await this.testCaseModel.findOne({
          where: [{ id: problemId }, { metadata_id: problemId }],
        });

        if (testCaseDoc?.cases && Array.isArray(testCaseDoc.cases)) {
          testCases = testCaseDoc.cases.map((tc: any, i: number) => ({
            id: i + 1,
            input: tc.input || '',
            expected: tc.output || '',
            isHidden: tc.isHidden === true,
          }));
        }

        if (testCases.length === 0) {
          this.logger.warn(
            `[Judge] No test cases found for problem ${problemId}`,
          );
          if (submission) {
            submission.status = SubmissionStatus.SYSTEM_ERROR;
            submission.compileOutput = 'No test cases configured for this problem';
            submission.completedAt = new Date();
            await this.submissionRepo.save(submission);
          }
          this.appGateway.emitToUser(userId, 'execution_error', {
            submissionId,
            status: SubmissionStatus.SYSTEM_ERROR,
            error: 'No test cases configured for this problem',
          });
          return { status: SubmissionStatus.SYSTEM_ERROR };
        }

        // 3. Notify user of testing phase
        this.appGateway.emitToUser(userId, 'submission_status', {
          submissionId,
          status: SubmissionStatus.TESTING,
          message: `Executing your ${language} code against ${testCases.length} test case(s)...`,
          totalTestCases: testCases.length,
        });

        // 4. Build execution config
        const config: any = {};

        // 5. Execute code in sandbox
        const start = Date.now();
        const results = await this.executionService.executeCode(
          language,
          code,
          testCases,
          config,
        );
        const runtime = Date.now() - start;

        // 6. Evaluate results
        let passedCount = 0;
        let hasCompileError = false;
        let hasRuntimeError = false;
        let hasTLE = false;
        let hasMemoryLimit = false;
        let compileOutput = '';

        for (const res of results) {
          if (res.passed) {
            passedCount++;
          }
          if (res.status === Status.COMPILATION_ERROR) {
            hasCompileError = true;
            compileOutput = res.error || '';
          }
          if (res.status === Status.RUNTIME_ERROR) hasRuntimeError = true;
          if (res.status === Status.TIME_LIMIT_EXCEEDED) hasTLE = true;
          if (res.status === Status.MEMORY_LIMIT_EXCEEDED)
            hasMemoryLimit = true;
        }

        const allPassed = passedCount === testCases.length;
        let status: string;
        if (allPassed) {
          status = SubmissionStatus.ACCEPTED;
        } else if (hasCompileError) {
          status = SubmissionStatus.COMPILATION_ERROR;
        } else if (hasMemoryLimit) {
          status = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
        } else if (hasRuntimeError) {
          status = SubmissionStatus.RUNTIME_ERROR;
        } else if (hasTLE) {
          status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        } else {
          status = SubmissionStatus.WRONG_ANSWER;
        }

        // 7. Update DB with final results
        if (submission) {
          submission.status = status;
          submission.runtime = runtime;
          submission.executionTime = runtime;
          submission.testCasesPassed = passedCount;
          submission.testsPassed = passedCount;
          submission.totalTestCases = testCases.length;
          submission.totalTests = testCases.length;
          submission.compileOutput = compileOutput || undefined;
          submission.completedAt = new Date();
          submission.testResults = results.map((result, index) =>
            testCases[index]?.isHidden
              ? {
                  testId: String(result.id),
                  passed: result.passed,
                  executionTime: result.executionTime,
                  error: result.error,
                }
              : {
                  testId: String(result.id),
                  passed: result.passed,
                  executionTime: result.executionTime,
                  error: result.error,
                },
          );
          await this.submissionRepo.save(submission);
        }

        if (status === SubmissionStatus.ACCEPTED && userId) {
          const user = await this.userRepo.findOne({ where: { id: userId } });
          if (user) {
            const stats = user.stats || {};
            user.stats = {
              ...stats,
              acceptedSubmissions: (stats.acceptedSubmissions || 0) + 1,
            };
            await this.userRepo.save(user);
          }
        }

        // 8. Notify user of completion
        const completionPayload = {
          submissionId,
          status,
          runtime,
          passedCount,
          totalCount: testCases.length,
          results: results.map((result, index) =>
            testCases[index]?.isHidden
              ? {
                  id: result.id,
                  passed: result.passed,
                  status: result.status,
                  executionTime: result.executionTime,
                }
              : result,
          ),
        };

        this.appGateway.emitToUser(
          userId,
          'submission_completed',
          completionPayload,
        );
        this.appGateway.emitToUser(
          userId,
          'execution_complete',
          completionPayload,
        );

        this.logger.log(
          `[Judge] Submission ${submissionId}: ${status} (${passedCount}/${testCases.length}) in ${runtime}ms`,
        );

        return { status, passedCount, totalCount: testCases.length };
      } catch (err: any) {
        this.logger.error(
          `[Judge] Error processing submission ${submissionId}: ${err.message}`,
          err.stack,
        );

        const sub = await this.submissionRepo.findOne({
          where: [{ id: submissionId }, { mongoId: submissionId }],
        });
        if (sub) {
          sub.status = SubmissionStatus.SYSTEM_ERROR;
          sub.compileOutput = `Internal error: ${err.message}`;
          sub.completedAt = new Date();
          await this.submissionRepo.save(sub);
        }

        this.appGateway.emitToUser(userId, 'execution_error', {
          submissionId,
          status: SubmissionStatus.SYSTEM_ERROR,
          error: 'An internal error occurred during execution.',
        });

        throw err;
      } finally {
        const client = this.redisService.getClient();
        if (client && userId) {
          try {
            await client.decr(`active:submissions:${userId}`);
          } catch (e) {
            // Ignore redis cleanup error
          }
        }
      }
    }
  }

  private overallStatus(
    results: Array<{ passed: boolean; status: string }>,
  ): string {
    if (results.every((result) => result.passed)) return Status.ACCEPTED;
    if (results.some((result) => result.status === Status.COMPILATION_ERROR)) {
      return Status.COMPILATION_ERROR;
    }
    if (
      results.some((result) => result.status === Status.MEMORY_LIMIT_EXCEEDED)
    ) {
      return Status.MEMORY_LIMIT_EXCEEDED;
    }
    if (results.some((result) => result.status === Status.RUNTIME_ERROR)) {
      return Status.RUNTIME_ERROR;
    }
    if (
      results.some((result) => result.status === Status.TIME_LIMIT_EXCEEDED)
    ) {
      return Status.TIME_LIMIT_EXCEEDED;
    }
    if (results.some((result) => result.status === Status.SYSTEM_ERROR)) {
      return Status.SYSTEM_ERROR;
    }
    return Status.WRONG_ANSWER;
  }
}

import { PistonUnavailableError } from './piston/piston.types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutionService } from './execution.service';
import { Submission } from '../database/entities/submission.entity';
import { ProblemsService } from '../problems/problems.service';
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
    private readonly problemsService: ProblemsService,
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
        runtime: results.every((result) => result.executionTime !== undefined)
          ? results.reduce((total, result) => total + result.executionTime!, 0)
          : undefined,
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
      const { submissionId } = job.data;
      let userId: string | undefined;
      let finalizedHere = false;

      try {
        // 1. Mark as running in DB
        const submission = await this.submissionRepo.findOne({
          where: [{ id: submissionId }, { mongoId: submissionId }],
        });

        if (!submission) throw new Error('Submission not found');
        if (submission.completedAt || submission.status === 'cancelled')
          return { status: submission.status };
        const { problemId, code, language } = submission;
        userId = submission.userId;

        const claimed = await this.submissionRepo.manager.transaction(
          async (manager) => {
            const current = await manager.findOne(Submission, {
              where: { id: submission.id },
              lock: { mode: 'pessimistic_write' },
            });
            if (
              !current ||
              current.completedAt ||
              current.status === 'cancelled'
            )
              return false;
            submission.status = SubmissionStatus.RUNNING;
            submission.startedAt = new Date();
            await manager.save(Submission, submission);
            return true;
          },
        );
        if (!claimed) return { status: 'already_processed' };

        this.appGateway.emitToUser(userId, 'submission_status', {
          submissionId,
          status: SubmissionStatus.RUNNING,
          message: `Worker picked up submission on ${this.runnerId}`,
        });

        // 2. Resolve the persisted source and authoritative judge data.
        const problem = await this.problemsService.getExecutionProblem(
          problemId,
          submission.problemSource || 'problem',
        );
        const testCases = problem.testCases.map((tc, i) => ({
          id: i + 1,
          input: tc.input || '',
          expected: tc.output || '',
          isHidden: tc.isHidden === true,
        }));

        if (testCases.length === 0) {
          this.logger.warn(
            `[Judge] No test cases found for problem ${problemId}`,
          );
          if (submission) {
            submission.status = SubmissionStatus.SYSTEM_ERROR;
            submission.compileOutput =
              'No test cases configured for this problem';
            submission.completedAt = new Date();
            await this.submissionRepo.save(submission);
            finalizedHere = true;
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
        const config = problem.config;

        // 5. Execute code in sandbox
        const start = Date.now();
        const results = await this.executionService.executeCode(
          language,
          code,
          testCases,
          config,
        );
        const processingLatencyMs = Date.now() - start;
        const runtime = results.every((r) => r.executionTime !== undefined)
          ? results.reduce((sum, r) => sum + r.executionTime!, 0)
          : undefined;

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
        } else if (results.some((r) => r.status === Status.SYSTEM_ERROR)) {
          status = SubmissionStatus.SYSTEM_ERROR;
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
          const memory = results.every((r) => r.memoryUsed !== undefined)
            ? Math.max(...results.map((r) => r.memoryUsed!))
            : undefined;
          submission.memory = memory;
          submission.memoryUsed = memory;
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
                  memoryUsed: result.memoryUsed,
                }
              : {
                  testId: String(result.id),
                  passed: result.passed,
                  executionTime: result.executionTime,
                  memoryUsed: result.memoryUsed,
                  error: result.error,
                },
          );
          // Commit verdict and counters under a row lock. Concurrent/stalled replays
          // may execute twice, but only one verdict changes scoring/counters.
          const committed = await this.submissionRepo.manager.transaction(
            async (manager) => {
              const locked = await manager.findOne(Submission, {
                where: { id: submission.id },
                lock: { mode: 'pessimistic_write' },
              });
              if (
                !locked ||
                locked.completedAt ||
                locked.status === 'cancelled'
              )
                return false;
              await manager.save(Submission, submission);
              if (status === SubmissionStatus.ACCEPTED && userId) {
                const user = await manager.findOne(User, {
                  where: { id: userId },
                  lock: { mode: 'pessimistic_write' },
                });
                if (user) {
                  user.stats = {
                    ...(user.stats || {}),
                    acceptedSubmissions:
                      (user.stats?.acceptedSubmissions || 0) + 1,
                  };
                  await manager.save(User, user);
                }
              }
              return true;
            },
          );
          if (!committed) return { status: 'already_processed' };
          finalizedHere = true;
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
                  memoryUsed: result.memoryUsed,
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
          `[Judge] Submission ${submissionId}: ${status} (${passedCount}/${testCases.length}) processingLatency=${processingLatencyMs}ms`,
        );

        return { status, passedCount, totalCount: testCases.length };
      } catch (err: any) {
        this.logger.error(
          `[Judge] Error processing submission ${submissionId}: ${err.message}`,
          err.stack,
        );

        const willRetry =
          err instanceof PistonUnavailableError &&
          job.attemptsMade + 1 < (job.opts?.attempts || 1);
        const sub = await this.submissionRepo.findOne({
          where: [{ id: submissionId }, { mongoId: submissionId }],
        });
        if (sub?.completedAt || sub?.status === 'cancelled')
          return { status: sub.status };
        if (sub) {
          sub.status = willRetry
            ? SubmissionStatus.QUEUED
            : SubmissionStatus.SYSTEM_ERROR;
          sub.compileOutput = willRetry
            ? undefined
            : 'Code execution is temporarily unavailable.';
          sub.completedAt = willRetry ? undefined : new Date();
          await this.submissionRepo.save(sub);
          finalizedHere = !willRetry;
        }

        if (userId && !willRetry) {
          this.appGateway.emitToUser(userId, 'execution_error', {
            submissionId,
            status: SubmissionStatus.SYSTEM_ERROR,
            error: 'An internal error occurred during execution.',
          });
        }

        throw err;
      } finally {
        const client = this.redisService.getClient();
        if (client && userId && finalizedHere) {
          try {
            const latest = await this.submissionRepo.findOne({
              where: { id: submissionId },
            });
            if (latest?.completedAt)
              await client.eval("local n = tonumber(redis.call('GET', KEYS[1]) or '0'); if n > 0 then return redis.call('DECR', KEYS[1]) end; return 0", 1, `active:submissions:${userId}`);
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
    if (
      !results.length ||
      results.some((result) => result.status === Status.SYSTEM_ERROR)
    )
      return Status.SYSTEM_ERROR;
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

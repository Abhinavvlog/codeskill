import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../database/entities/submission.entity';
import { User } from '../database/entities/user.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppGateway } from '../gateway/app.gateway';
import { RedisService } from '../redis/redis.service';
import {
  SUPPORTED_LANGUAGES,
  canonicalLanguage,
} from '../execution/execution.types';
import { ProblemsService } from '../problems/problems.service';

export enum SubmissionStatus {
  QUEUED = 'queued',
  PENDING = 'pending',
  RUNNING = 'running',
  ACCEPTED = 'accepted',
  WRONG_ANSWER = 'wrong_answer',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  COMPILATION_ERROR = 'compilation_error',
  RUNTIME_ERROR = 'runtime_error',
  INTERNAL_ERROR = 'internal_error',
  CANCELLED = 'cancelled',
}

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue('submissions') private submissionQueue: Queue,
    private readonly appGateway: AppGateway,
    private readonly redisService: RedisService,
    private readonly problemsService: ProblemsService,
  ) {}

  async createSubmission(userId: string, data: unknown) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid submission payload');
    }
    const { code, language, problemId } = data as Record<string, unknown>;

    if (typeof code !== 'string' || !code) {
      throw new BadRequestException('Missing or invalid code');
    }
    if (!language || typeof language !== 'string') {
      throw new BadRequestException('Missing or invalid language');
    }
    if (typeof problemId !== 'string' || !problemId.trim()) {
      throw new BadRequestException('Missing problemId');
    }

    const langLower = language.trim().toLowerCase();
    const resolvedLanguage = canonicalLanguage(langLower);
    if (!resolvedLanguage) {
      throw new BadRequestException(
        `Unsupported language: "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      );
    }

    if (Buffer.byteLength(code, 'utf8') > 1_000_000) {
      throw new BadRequestException('Source code exceeds the 1MB limit');
    }

    // Resolve publication and judge data on the server; client source/state is ignored.
    const problem = await this.problemsService.getExecutionProblem(
      problemId.trim(),
    );
    const allowedLanguages = problem.config.supportedLanguages;
    if (
      allowedLanguages.length > 0 &&
      !allowedLanguages.some(
        (language) => canonicalLanguage(language) === resolvedLanguage,
      )
    ) {
      throw new BadRequestException(
        'This language is not enabled for the problem',
      );
    }
    if (!problem.testCases.length) {
      throw new BadRequestException(
        'No test cases configured for this problem',
      );
    }

    // 1. Create submission in PostgreSQL with status 'queued'
    const submission = this.submissionRepo.create({
      userId,
      user: { id: userId },
      problemId: problem.id,
      problemSource: problem.source,
      code,
      language: langLower,
      status: SubmissionStatus.QUEUED,
      queuedAt: new Date(),
      testResults: [],
    });
    await this.submissionRepo.save(submission);

    // 2. Increment active running jobs for user in Redis
    const client = this.redisService.getClient();
    if (client) {
      await client.incr(`active:submissions:${userId}`);
      await client.expire(`active:submissions:${userId}`, 120);
    }

    // 3. Enqueue to BullMQ runner queue
    await this.submissionQueue.add(
      'evaluate-code',
      {
        submissionId: submission.id,
        problemId: problem.id,
        problemSource: problem.source,
        code,
        language: langLower,
        userId,
      },
      {
        jobId: String(submission.id),
        attempts: 2,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 5000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
      },
    );

    // 4. Update user's submission count stats
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      const stats = user.stats || {};
      user.stats = {
        ...stats,
        totalSubmissions: (stats.totalSubmissions || 0) + 1,
      };
      await this.userRepo.save(user);
    }

    // 5. Broadcast initial queued status via WebSocket
    this.appGateway.emitToUser(userId, 'submission_status', {
      submissionId: submission.id,
      status: SubmissionStatus.QUEUED,
      problemId: problem.id,
      queuedAt: submission.queuedAt,
    });

    return { ...submission, _id: submission.id };
  }

  async getSubmissionById(
    userId: string,
    submissionId: string,
    isAdmin = false,
  ) {
    const submission = await this.submissionRepo.findOne({
      where: [{ id: submissionId }, { mongoId: submissionId }],
      relations: { user: true },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (
      !isAdmin &&
      submission.userId !== userId &&
      (submission as any).user?.id !== userId
    ) {
      throw new ForbiddenException('Access denied to this submission');
    }

    return { ...submission, _id: submission.id };
  }

  async getSubmissionResult(
    userId: string,
    submissionId: string,
    isAdmin = false,
  ) {
    const submission = await this.getSubmissionById(
      userId,
      submissionId,
      isAdmin,
    );

    return {
      submissionId: submission.id,
      _id: submission.id,
      status: submission.status,
      runtime: submission.runtime ?? submission.executionTime,
      memory: submission.memory ?? submission.memoryUsed,
      testCasesPassed: submission.testCasesPassed ?? submission.testsPassed,
      totalTestCases: submission.totalTestCases ?? submission.totalTests,
      compileOutput: submission.compileOutput ?? submission.errorMessage,
      testResults: submission.testResults || [],
      queuedAt: submission.queuedAt,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
    };
  }

  async cancelSubmission(
    userId: string,
    submissionId: string,
    isAdmin = false,
  ) {
    const submission = await this.submissionRepo.findOne({
      where: [{ id: submissionId }, { mongoId: submissionId }],
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (!isAdmin && submission.userId !== userId) {
      throw new ForbiddenException('Access denied to this submission');
    }

    if (
      submission.status !== SubmissionStatus.QUEUED &&
      submission.status !== 'pending'
    ) {
      throw new BadRequestException(
        `Cannot cancel submission with status "${submission.status}". Only queued submissions can be cancelled.`,
      );
    }

    try {
      const job = await this.submissionQueue.getJob(submissionId);
      if (job) {
        await job.remove();
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not remove job ${submissionId} from queue: ${err.message}`,
      );
    }

    submission.status = SubmissionStatus.CANCELLED;
    submission.completedAt = new Date();
    await this.submissionRepo.save(submission);

    const client = this.redisService.getClient();
    if (client) {
      await client.decr(`active:submissions:${userId}`);
    }

    this.appGateway.emitToUser(userId, 'submission_status', {
      submissionId: submission.id,
      status: SubmissionStatus.CANCELLED,
      message: 'Submission cancelled by user',
    });

    return { success: true, message: 'Submission cancelled successfully' };
  }

  async getSubmissionsByProblem(userId: string, problemId: string) {
    const list = await this.submissionRepo.find({
      where: { userId, problemId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return list.map((s) => ({ ...s, _id: s.id }));
  }

  async getRecentSubmissions(userId: string) {
    const list = await this.submissionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return list.map((s) => ({ ...s, _id: s.id }));
  }

  async getSubmissionsByUser(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      problemId?: string;
      status?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.problemId) where.problemId = query.problemId;
    if (query.status) where.status = query.status;

    const [submissions, total] = await this.submissionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      submissions: submissions.map((s) => ({ ...s, _id: s.id })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        stats: true,
        badges: true,
        activityMap: true,
        name: true,
        avatar: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const totalSubmissions = await this.submissionRepo.count({
      where: { userId },
    });
    const acceptedSubmissions = await this.submissionRepo.count({
      where: { userId, status: 'accepted' },
    });

    return {
      user: { ...user, _id: user.id },
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate:
        totalSubmissions > 0
          ? (acceptedSubmissions / totalSubmissions) * 100
          : 0,
    };
  }
}

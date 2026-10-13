import { canonicalLanguage } from './execution.types';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ExecutionService, Status } from './execution.service';
import { AzureExecutionService } from './azure-execution.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubmissionRateLimitGuard } from '../common/guards/submission-rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Execution')
@UseGuards(JwtAuthGuard)
@Controller('execution')
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly azureExecutionService: AzureExecutionService,
    @InjectQueue('submissions') private readonly submissionQueue: Queue,
  ) {}

  @Get('health')
  @UseGuards(AdminGuard)
  async executionHealth() {
    const runtimes = await this.runtimes();
    const counts = await this.submissionQueue.getJobCounts(
      'waiting',
      'active',
      'failed',
      'completed',
      'delayed',
    );
    const workers = await this.submissionQueue.getWorkers();
    return {
      provider: this.executionService.provider,
      ready: runtimes.some((r) => r.enabled) && workers.length > 0,
      runtimes,
      queue: counts,
      workers: workers.length,
      execution: this.executionService.executionMetrics(),
    };
  }

  @Get('runtimes')
  async runtimes() {
    try {
      return await this.executionService.availableLanguages();
    } catch {
      throw new ServiceUnavailableException(
        'Code execution is temporarily unavailable',
      );
    }
  }

  @Post('run')
  @UseGuards(SubmissionRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute code against test cases without saving a submission',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code', 'language', 'testCases'],
      properties: {
        code: { type: 'string', description: 'Source code to execute' },
        language: {
          type: 'string',
          enum: [
            'c',
            'cpp',
            'c++',
            'java',
            'python',
            'python3',
            'py',
            'javascript',
            'js',
            'node',
          ],
          description: 'Programming language',
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              input: { type: 'string', description: 'Stdin input' },
              expected: {
                type: 'string',
                description: 'Expected stdout output',
              },
            },
          },
        },
        config: {
          type: 'object',
          description:
            'Optional execution configuration (timeLimit, memoryLimit, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Execution results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: { type: 'string', enum: Object.values(Status) },
        results: { type: 'array' },
        runtime: { type: 'number' },
        passedCount: { type: 'number' },
        totalCount: { type: 'number' },
      },
    },
  })
  async runCode(@CurrentUser('id') userId: string, @Body() body: any) {
    const { language, code, testCases, config = {} } = body;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('Missing or invalid "code" field');
    }
    if (!language || typeof language !== 'string') {
      throw new BadRequestException('Missing or invalid "language" field');
    }
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      throw new BadRequestException('Missing or invalid "testCases" array');
    }

    // Validate supported language
    const supportedLanguages = [
      'c',
      'cpp',
      'c++',
      'java',
      'python',
      'python3',
      'py',
      'javascript',
      'js',
      'node',
      'typescript',
      'ts',
    ];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported language: "${language}". Supported: ${supportedLanguages.join(', ')}`,
      );
    }

    if (!config || typeof config !== 'object' || Array.isArray(config))
      throw new BadRequestException('Invalid execution configuration');
    const allowedConfig = [
      'timeLimit',
      'memoryLimit',
      'executionMode',
      'functionSignature',
      'exactOutput',
      'trimTrailingWhitespace',
      'floatTolerance',
      'floatRelativeTolerance',
      'customInput',
    ];
    if (Object.keys(config).some((key) => !allowedConfig.includes(key)))
      throw new BadRequestException('Unsupported execution configuration');
    for (const key of [
      'timeLimit',
      'memoryLimit',
      'floatTolerance',
      'floatRelativeTolerance',
    ]) {
      if (
        config[key] !== undefined &&
        (typeof config[key] !== 'number' ||
          !Number.isFinite(config[key]) ||
          config[key] < 0)
      )
        throw new BadRequestException('Invalid execution limits');
    }
    this.executionService.validateRequest(code, testCases);
    const job = await this.submissionQueue.add(
      'run-code',
      { code, language, testCases, config, userId },
      {
        attempts: 1,
        removeOnComplete: { age: 15 * 60, count: 2000 },
        removeOnFail: { age: 60 * 60, count: 2000 },
      },
    );
    return {
      success: true,
      status: 'queued',
      jobId: job.id,
      message: 'Execution queued',
    };
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get an asynchronous execution result' })
  async getJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const job = await this.submissionQueue.getJob(jobId);
    if (
      !job ||
      !job.data.userId ||
      String(job.data.userId) !== String(userId)
    ) {
      throw new NotFoundException('Execution job not found');
    }
    const state = await job.getState();
    if (state === 'completed') return job.returnvalue;
    if (state === 'failed') {
      return {
        success: false,
        status: Status.SYSTEM_ERROR,
        message: 'The judge worker could not complete this execution',
        results: [],
        runtime: 0,
        passedCount: 0,
        totalCount: Array.isArray(job.data.testCases)
          ? job.data.testCases.length
          : 0,
      };
    }
    return { success: true, status: state, jobId };
  }

  /**
   * Azure-backed code execution endpoint.
   * For 3000+ concurrent students — routes to Microsoft Azure ACI via Judge0.
   * Falls back to BullMQ queue if Azure is not configured.
   */
  @Post('azure-run')
  @UseGuards(SubmissionRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Execute code via Azure Container Instances (Microsoft-powered, high scale)',
  })
  async azureRun(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      code: string;
      language: string;
      stdin?: string;
      testCases?: Array<{ id: string; input: string; expected: string }>;
      timeoutMs?: number;
      memoryMB?: number;
    },
  ) {
    if (
      typeof body.code !== 'string' ||
      typeof body.language !== 'string' ||
      !body.code ||
      !body.language
    ) {
      throw new BadRequestException('code and language are required');
    }

    // If Azure is not configured, route to isolated BullMQ worker queue
    if (
      this.executionService.provider === 'piston' ||
      !this.azureExecutionService.isAvailable
    ) {
      const isSingleRun = !body.testCases || body.testCases.length === 0;
      const testCases = isSingleRun
        ? [{ id: 'run', input: body.stdin || '', expected: '' }]
        : body.testCases!;

      this.executionService.validateRequest(body.code, testCases);
      if (
        !(await this.executionService.availableLanguages()).some(
          (r) => r.language === canonicalLanguage(body.language) && r.enabled,
        )
      )
        throw new BadRequestException('This language runtime is unavailable');
      const job = await this.submissionQueue.add(
        'run-code',
        {
          code: body.code,
          language: body.language,
          testCases,
          config: {
            customInput: isSingleRun,
            timeLimit: body.timeoutMs || 3000,
            memoryLimit: body.memoryMB || 256,
          },
          userId,
        },
        {
          attempts: 1,
          removeOnComplete: { age: 15 * 60, count: 2000 },
          removeOnFail: { age: 60 * 60, count: 2000 },
        },
      );

      return {
        success: true,
        engine: 'queue',
        status: 'queued',
        jobId: job.id,
        message: 'Execution queued to isolated runner pool',
      };
    }

    try {
      if (body.testCases && body.testCases.length > 0) {
        const results = await this.azureExecutionService.executeWithTestCases(
          body.code,
          body.language,
          body.testCases,
          { timeoutMs: body.timeoutMs, memoryMB: body.memoryMB },
        );
        const passedCount = results.filter((r) => r.passed).length;
        return {
          success: true,
          engine: 'azure',
          passedCount,
          totalCount: results.length,
          results,
        };
      } else {
        const result = await this.azureExecutionService.execute({
          code: body.code,
          language: body.language,
          stdin: body.stdin,
          timeoutMs: body.timeoutMs,
          memoryMB: body.memoryMB,
        });
        return {
          success: true,
          engine: 'azure',
          result,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        engine: 'azure',
        error: 'Code execution is temporarily unavailable.',
      };
    }
  }
}

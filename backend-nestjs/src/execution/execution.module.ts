import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { AzureExecutionService } from './azure-execution.service';
import { JudgeProcessor } from './judge.processor';
import { Submission } from '../database/entities/submission.entity';
import { User } from '../database/entities/user.entity';
import { GatewayModule } from '../gateway/gateway.module';
import { RedisModule } from '../redis/redis.module';
import { ProblemsModule } from '../problems/problems.module';

import { SubmissionRateLimitGuard } from '../common/guards/submission-rate-limit.guard';

const shouldRegisterJudge =
  process.env.PROCESS_ROLE === 'judge' ||
  process.env.PROCESS_ROLE === 'worker' ||
  process.env.ENABLE_EMBEDDED_JUDGE === 'true' ||
  (!process.env.PROCESS_ROLE && process.env.NODE_ENV !== 'production');

const judgeProviders = shouldRegisterJudge ? [JudgeProcessor] : [];

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, User]),
    BullModule.registerQueue({
      name: 'submissions',
    }),
    GatewayModule,
    RedisModule,
    ProblemsModule,
  ],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    AzureExecutionService,
    SubmissionRateLimitGuard,
    ...judgeProviders,
  ],
  exports: [ExecutionService, AzureExecutionService],
})
export class ExecutionModule {}

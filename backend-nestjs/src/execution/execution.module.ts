import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { AzureExecutionService } from './azure-execution.service';
import { JudgeProcessor } from './judge.processor';
import { Submission } from '../database/entities/submission.entity';
import { ProblemMetadata } from '../database/entities/problem-metadata.entity';
import { ProblemTestCase } from '../database/entities/problem-testcase.entity';
import { User } from '../database/entities/user.entity';
import { GatewayModule } from '../gateway/gateway.module';
import { RedisModule } from '../redis/redis.module';

const judgeProviders =
  process.env.PROCESS_ROLE === 'judge' ? [JudgeProcessor] : [];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Submission,
      ProblemMetadata,
      ProblemTestCase,
      User,
    ]),
    BullModule.registerQueue({
      name: 'submissions',
    }),
    GatewayModule,
    RedisModule,
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, AzureExecutionService, ...judgeProviders],
  exports: [ExecutionService, AzureExecutionService],
})
export class ExecutionModule {}

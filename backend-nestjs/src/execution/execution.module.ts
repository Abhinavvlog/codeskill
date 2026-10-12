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

const judgeProviders =
  process.env.PROCESS_ROLE === 'judge' ? [JudgeProcessor] : [];

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
  providers: [ExecutionService, AzureExecutionService, ...judgeProviders],
  exports: [ExecutionService, AzureExecutionService],
})
export class ExecutionModule {}

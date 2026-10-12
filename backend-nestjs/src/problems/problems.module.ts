import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { Problem as ProblemEntity } from '../database/entities/problem.entity';
import { ProblemMetadata } from '../database/entities/problem-metadata.entity';
import { Question } from '../database/entities/question.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProblemEntity, ProblemMetadata, Question]),
    RedisModule,
  ],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContestsController } from './contests.controller';
import { ContestsService } from './contests.service';
import { Contest } from '../database/entities/contest.entity';
import { ContestAttempt } from '../database/entities/contest-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contest, ContestAttempt]),
  ],
  controllers: [ContestsController],
  providers: [ContestsService],
  exports: [ContestsService],
})
export class ContestsModule {}

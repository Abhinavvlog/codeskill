import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import {
  QuestionsController,
  QuestionBanksController,
} from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [QuestionsController, QuestionBanksController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

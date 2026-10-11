import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { AssessmentAttempt } from '../database/entities/assessment-attempt.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssessmentAttempt, Assessment, Question]),
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '../database/entities/assessment.entity';
import { AssessmentAttempt } from '../database/entities/assessment-attempt.entity';
import { Question } from '../database/entities/question.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AssessmentsService } from './assessments.service';
import { AssessmentsAdminController } from './assessments-admin.controller';
import { AssessmentsStudentController } from './assessments-student.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      AssessmentAttempt,
      Question,
      AuditLog,
    ]),
  ],
  controllers: [AssessmentsAdminController, AssessmentsStudentController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}

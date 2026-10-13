import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../database/entities/subject.entity';
import { Assessment } from '../database/entities/assessment.entity';
import { Question } from '../database/entities/question.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, Assessment, Question, AuditLog]),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}

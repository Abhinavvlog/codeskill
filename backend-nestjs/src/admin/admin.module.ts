import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDashboardController } from './controllers/dashboard.controller';
import { AdminUsersController } from './controllers/users.controller';
import { AdminProblemsController } from './controllers/problems.controller';
import { AdminContestsController } from './controllers/contests.controller';
import { AdminCompaniesController } from './controllers/companies.controller';
import { AdminUniversitiesController } from './controllers/universities.controller';
import { AdminService } from './admin.service';

import { User, UserSchema } from '../database/schemas/user.schema';
import {
  ProblemMetadata,
  ProblemMetadataSchema,
} from '../database/schemas/problem-metadata.schema';
import {
  ProblemStatement,
  ProblemStatementSchema,
} from '../database/schemas/problem-statement.schema';
import {
  ProblemConfig,
  ProblemConfigSchema,
} from '../database/schemas/problem-config.schema';
import {
  ProblemTestCase,
  ProblemTestCaseSchema,
} from '../database/schemas/problem-testcase.schema';
import { Contest, ContestSchema } from '../database/schemas/contest.schema';
import { Company, CompanySchema } from '../database/schemas/company.schema';
import {
  University,
  UniversitySchema,
} from '../database/schemas/university.schema';
import {
  Submission,
  SubmissionSchema,
} from '../database/schemas/submission.schema';
import {
  Assessment,
  AssessmentSchema,
} from '../database/schemas/assessment.schema';
import {
  Question,
  QuestionSchema,
} from '../database/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ProblemMetadata.name, schema: ProblemMetadataSchema },
      { name: ProblemStatement.name, schema: ProblemStatementSchema },
      { name: ProblemConfig.name, schema: ProblemConfigSchema },
      { name: ProblemTestCase.name, schema: ProblemTestCaseSchema },
      { name: Contest.name, schema: ContestSchema },
      { name: Company.name, schema: CompanySchema },
      { name: University.name, schema: UniversitySchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Assessment.name, schema: AssessmentSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminProblemsController,
    AdminContestsController,
    AdminCompaniesController,
    AdminUniversitiesController,
  ],
  providers: [AdminService],
})
export class AdminModule {}

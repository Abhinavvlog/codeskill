import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from '../database/entities/company.entity';
import { Job } from '../database/entities/job.entity';
import { CompanyUser } from '../database/entities/company-user.entity';
import { CompanyController } from './company.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Job, CompanyUser]),
  ],
  controllers: [CompaniesController, CompanyController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}

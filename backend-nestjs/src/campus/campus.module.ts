import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusController } from './campus.controller';
import { CampusService } from './campus.service';
import { University } from '../database/entities/university.entity';
import { UniversityUser } from '../database/entities/university-user.entity';
import { Batch } from '../database/entities/batch.entity';
import { StudentEnrollment } from '../database/entities/student-enrollment.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      University,
      UniversityUser,
      Batch,
      StudentEnrollment,
      User,
    ]),
  ],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}

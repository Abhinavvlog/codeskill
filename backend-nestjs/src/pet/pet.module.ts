import { Module } from '@nestjs/common';
import { ProblemsModule } from '../problems/problems.module';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

@Module({
  imports: [ProblemsModule],
  controllers: [PetController],
  providers: [PetService],
})
export class PetModule {}

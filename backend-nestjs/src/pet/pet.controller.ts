import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PetService } from './pet.service';

@ApiTags('Practice Pet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Ask the practice pet about a coding problem' })
  ask(@CurrentUser('id') userId: string, @Body() body: unknown) {
    return this.petService.ask(userId, body);
  }
}

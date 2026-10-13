import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
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
  ask(@CurrentUser() user: any, @Body() body: unknown) {
    if (user?.isAssessmentStudent) {
      throw new ForbiddenException(
        'AI coding assistant is strictly disabled during active examinations (AUD-017).',
      );
    }
    return this.petService.ask(user?.id || user?._id, body);
  }
}

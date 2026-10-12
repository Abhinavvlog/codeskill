import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProblemsService, type PublicProblemsQuery } from './problems.service';

@ApiTags('Problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated problems list' })
  async getProblems(@Query() query: PublicProblemsQuery) {
    return this.problemsService.getProblems(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single problem by slug' })
  async getProblemBySlug(@Param('slug') slug: string) {
    return this.problemsService.getProblemBySlug(slug);
  }
}

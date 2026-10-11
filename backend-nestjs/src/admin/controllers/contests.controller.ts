import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from '../admin.service';

@ApiTags('Admin - Contests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/contests')
export class AdminContestsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all contests' })
  async getContests(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    return this.adminService.getContests(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contest by ID' })
  async getContest(@Param('id') id: string) {
    return this.adminService.getContestById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contest' })
  async createContest(@Body() body: any) {
    return this.adminService.createContest(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contest' })
  async updateContest(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateContest(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contest' })
  async deleteContest(@Param('id') id: string) {
    return this.adminService.deleteContest(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampusService } from './campus.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Campus')
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @ApiOperation({ summary: 'Get all verified universities' })
  async getUniversities() {
    return this.campusService.getUniversities();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new university' })
  async registerUniversity(@Request() req: any, @Body() body: any) {
    return this.campusService.registerUniversity(req.user.id, body);
  }

  @Get('my-universities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all universities the user belongs to' })
  async getMyUniversities(@Request() req: any) {
    return this.campusService.getMyUniversities(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get university profile for portal' })
  async getUniversityById(@Param('id') id: string) {
    return this.campusService.getUniversityById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update university profile' })
  async updateUniversity(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.campusService.updateUniversity(id, body, req.user);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get university profile' })
  async getUniversityProfile(@Param('username') username: string) {
    return this.campusService.getUniversityProfile(username);
  }
}

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GenkitService } from './genkit.service';
import { DraftProfileDto } from './dto/draft-profile.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('ai')
export class GenkitController {
  constructor(private readonly genkitService: GenkitService) {}

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Post('draft-profile')
  async draftProfile(@Body() dto: DraftProfileDto) {
    return this.genkitService.draftSchoolProfile(dto.schoolName, dto.location, dto.highlights);
  }

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Post('executive-summary/:schoolId')
  async generateExecutiveSummary(@Param('schoolId') schoolId: string) {
    return this.genkitService.generateExecutiveSummary(schoolId);
  }

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Get('reports/:schoolId')
  async getSchoolReports(@Param('schoolId') schoolId: string) {
    return this.genkitService.getSchoolReports(schoolId);
  }
}


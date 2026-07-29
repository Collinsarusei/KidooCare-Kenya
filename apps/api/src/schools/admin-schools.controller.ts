import { Controller, Post, Body, Get, Delete, Param, Patch } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { OnboardSchoolDto } from './dto/onboard-school.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Roles(UserRole.ADMIN)
@Controller('admin/schools')
export class AdminSchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post('onboard')
  async onboardSchool(@Body() dto: OnboardSchoolDto, @CurrentUser('id') adminId: string) {
    return this.schoolsService.onboardSchool(dto, adminId);
  }

  @Get()
  async getAdminSchoolsList() {
    return this.schoolsService.getAdminSchoolsList();
  }

  @Delete(':id')
  async deleteSchool(@Param('id') schoolId: string, @CurrentUser('id') adminId: string) {
    return this.schoolsService.deleteSchool(schoolId, adminId);
  }

  @Patch(':id/toggle-status')
  async toggleSchoolStatus(@Param('id') schoolId: string, @CurrentUser('id') adminId: string) {
    return this.schoolsService.toggleSchoolStatus(schoolId, adminId);
  }
}

import { Controller, Get, Post, Put, Body, Param, ForbiddenException, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('schools/:id/tutors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutorsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Roles(UserRole.SCHOOL)
  @Post()
  async addTutor(
    @Param('id') schoolId: string,
    @Body() dto: { name: string; email: string; phone: string },
    @CurrentUser() user: any,
  ) {
    // Verify ownership
    const school = await this.schoolsService.getSchoolById(schoolId);
    if (school.userId !== user.id) {
      throw new ForbiddenException('You can only add tutors to your own school');
    }

    return this.schoolsService.addTutor(schoolId, dto);
  }

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Get()
  async getTutors(@Param('id') schoolId: string) {
    return this.schoolsService.getTutorsBySchoolId(schoolId);
  }

  @Roles(UserRole.SCHOOL)
  @Put(':tutorId')
  async updateTutor(
    @Param('id') schoolId: string,
    @Param('tutorId') tutorId: string,
    @Body() dto: { email?: string; phone?: string },
    @CurrentUser() user: any,
  ) {
    const school = await this.schoolsService.getSchoolById(schoolId);
    if (school.userId !== user.id) {
      throw new ForbiddenException('You can only edit tutors in your own school');
    }
    return this.schoolsService.updateTutor(schoolId, tutorId, dto);
  }

  @Roles(UserRole.SCHOOL)
  @Post(':tutorId/resend')
  async resendTutorInvite(
    @Param('id') schoolId: string,
    @Param('tutorId') tutorId: string,
    @CurrentUser() user: any,
  ) {
    const school = await this.schoolsService.getSchoolById(schoolId);
    if (school.userId !== user.id) {
      throw new ForbiddenException('You can only resend invites to tutors in your own school');
    }
    return this.schoolsService.resendTutorInvite(schoolId, tutorId);
  }
}

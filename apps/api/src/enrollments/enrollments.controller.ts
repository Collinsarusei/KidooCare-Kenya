import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Roles(UserRole.PARENT)
  @Post('enrollments')
  async createEnrollment(@Body() dto: CreateEnrollmentDto, @CurrentUser('id') parentId: string) {
    return this.enrollmentsService.createEnrollment(parentId, dto);
  }

  @Roles(UserRole.PARENT)
  @Get('enrollments/my')
  async getMyEnrollments(@CurrentUser('id') parentId: string) {
    return this.enrollmentsService.getParentEnrollments(parentId);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL, UserRole.TUTOR)
  @Get('schools/:schoolId/enrollments')
  async getSchoolEnrollments(@Param('schoolId') schoolId: string, @CurrentUser() user: any) {
    return this.enrollmentsService.getSchoolEnrollments(schoolId, user.id, user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Post('enrollments/:id/promote')
  async promoteWaitlist(@Param('id') id: string, @CurrentUser() user: any) {
    return this.enrollmentsService.promoteWaitlist(id, user.id, user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL, UserRole.PARENT)
  @Post('enrollments/:id/end')
  async endEnrollment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.enrollmentsService.endEnrollment(id, user.id, user.role);
  }

  @Roles(UserRole.SCHOOL, UserRole.TUTOR)
  @Post('schools/:schoolId/walk-in')
  async createWalkInEnrollment(
    @Param('schoolId') schoolId: string,
    @Body() dto: { childName: string; childDob: string; parentName?: string; parentEmail?: string; parentPhone?: string; serviceId: string },
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.createWalkInEnrollment(schoolId, user.id, user.role, dto);
  }
}


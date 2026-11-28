import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './assessment.dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Roles(UserRole.TUTOR)
  @Post()
  create(@Body() dto: CreateAssessmentDto, @CurrentUser('id') tutorId: string) {
    return this.service.create(tutorId, dto);
  }

  @Roles(UserRole.TUTOR)
  @Get('mine')
  listMine(@CurrentUser('id') tutorId: string) {
    return this.service.listForTutor(tutorId);
  }

  @Roles(UserRole.SCHOOL)
  @Get('school/:schoolId')
  listSchool(@Param('schoolId') schoolId: string, @CurrentUser('id') userId: string) {
    return this.service.listForSchool(userId, schoolId);
  }

  @Roles(UserRole.PARENT)
  @Get('child/:childId')
  listChild(@Param('childId') childId: string, @CurrentUser('id') parentId: string) {
    return this.service.listForParentChild(parentId, childId);
  }

  @Roles(UserRole.TUTOR)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') tutorId: string) {
    return this.service.remove(tutorId, id);
  }
}

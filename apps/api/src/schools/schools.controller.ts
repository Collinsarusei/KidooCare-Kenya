import { Controller, Get, Put, Post, Param, Body, ForbiddenException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

import { AiService } from '../ai/ai.service';

@Controller('schools')
export class SchoolsController {
  constructor(
    private readonly schoolsService: SchoolsService,
    private readonly aiService: AiService
  ) {}

  @Public()
  @Get(':id')
  async getSchoolById(@Param('id') id: string) {
    return this.schoolsService.getSchoolById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Put(':id/credentials')
  async updateCredentials(
    @Param('id') schoolId: string,
    @Body() dto: UpdateCredentialsDto,
    @CurrentUser() user: any,
  ) {
    // If user is a SCHOOL manager, verify they own this school
    if (user.role === UserRole.SCHOOL) {
      const school = await this.schoolsService.getSchoolById(schoolId);
      if (school.userId !== user.id) {
        throw new ForbiddenException('You can only manage payment credentials for your own school');
      }
    }

    return this.schoolsService.updateCredentials(schoolId, dto, user.id, user.role);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Put(':id/profile')
  async updateSchoolProfile(
    @Param('id') schoolId: string,
    @Body() dto: { name?: string; about?: string; location?: string; logoUrl?: string; coverImages?: string[] },
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.SCHOOL) {
      const school = await this.schoolsService.getSchoolById(schoolId);
      if (school.userId !== user.id) {
        throw new ForbiddenException('You can only update profile details for your own school');
      }
    }
    return this.schoolsService.updateSchoolProfile(schoolId, dto, user.id);
  }

  @Roles(UserRole.SCHOOL)
  @Post(':id/generate-profile')
  async generateProfile(
    @Param('id') schoolId: string,
    @Body() dto: { name: string; rawDetails: string; facilities: string },
    @CurrentUser() user: any,
  ) {
    const school = await this.schoolsService.getSchoolById(schoolId);
    if (school.userId !== user.id) {
      throw new ForbiddenException('You can only generate profiles for your own school');
    }
    
    const profileMarkdown = await this.aiService.generateSchoolProfile(dto);
    
    // Automatically save it
    return this.schoolsService.updateSchoolProfile(schoolId, { about: profileMarkdown }, user.id);
  }
}

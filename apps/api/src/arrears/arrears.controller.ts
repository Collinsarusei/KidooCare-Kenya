import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArrearsService } from './arrears.service';

class ReminderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class PromptDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

@Roles(UserRole.SCHOOL)
@Controller('schools/:schoolId/arrears')
export class ArrearsController {
  constructor(private readonly service: ArrearsService) {}

  @Get()
  list(@Param('schoolId') schoolId: string, @CurrentUser('id') userId: string) {
    return this.service.list(schoolId, userId);
  }

  @Post('email-all')
  emailAll(@Param('schoolId') schoolId: string, @Body() dto: ReminderDto, @CurrentUser('id') userId: string) {
    return this.service.emailAll(schoolId, userId, dto.note);
  }

  @Post(':enrollmentId/email')
  email(
    @Param('schoolId') schoolId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: ReminderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.emailOne(schoolId, userId, enrollmentId, dto.note);
  }

  @Post(':enrollmentId/stk')
  stk(
    @Param('schoolId') schoolId: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: PromptDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.stkPrompt(schoolId, userId, enrollmentId, dto.phone);
  }
}

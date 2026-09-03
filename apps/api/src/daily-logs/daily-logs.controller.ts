import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, DailyLogMood } from '@prisma/client';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  @Roles(UserRole.TUTOR)
  @Post('child/:childId')
  async createDailyLog(
    @Param('childId') childId: string,
    @Body() dto: { isPresent: boolean; mood: DailyLogMood; achievements: string[]; milestones: string[]; allergiesSpotted?: string; assignments?: string },
    @CurrentUser() user: any
  ) {
    return this.dailyLogsService.createDailyLog(user.id, childId, dto);
  }

  @Roles(UserRole.PARENT)
  @Get('child/:childId')
  async getLogsByChildId(
    @Param('childId') childId: string,
    @CurrentUser() user: any
  ) {
    return this.dailyLogsService.getLogsByChildId(childId, user.id);
  }
}

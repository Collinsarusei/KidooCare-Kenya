import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  /** Tutor: create or update today's log for a child (one log per child per day). */
  @Roles(UserRole.TUTOR)
  @Post('child/:childId')
  async createDailyLog(
    @Param('childId') childId: string,
    @Body() dto: CreateDailyLogDto,
    @CurrentUser() user: any,
  ) {
    return this.dailyLogsService.upsertTodayLog(user.id, childId, dto);
  }

  /** Tutor: today's logs for every child at the tutor's daycare (attendance + pickups). */
  @Roles(UserRole.TUTOR)
  @Get('today')
  async getTodayLogs(@CurrentUser() user: any) {
    return this.dailyLogsService.getTodayLogsForTutor(user.id);
  }

  /** Tutor: confirm the parent has collected the child. */
  @Roles(UserRole.TUTOR)
  @Patch(':id/picked-up')
  async markPickedUp(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dailyLogsService.markPickedUp(id, user.id);
  }

  /** Parent: open pickup requests for any of their children today. */
  @Roles(UserRole.PARENT)
  @Get('pickup-requests')
  async getPickupRequests(@CurrentUser() user: any) {
    return this.dailyLogsService.getOpenPickupRequests(user.id);
  }

  /** Parent: "I'm on my way". */
  @Roles(UserRole.PARENT)
  @Patch(':id/acknowledge-pickup')
  async acknowledgePickup(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dailyLogsService.acknowledgePickup(id, user.id);
  }

  @Roles(UserRole.PARENT)
  @Get('child/:childId')
  async getLogsByChildId(@Param('childId') childId: string, @CurrentUser() user: any) {
    return this.dailyLogsService.getLogsByChildId(childId, user.id);
  }
}

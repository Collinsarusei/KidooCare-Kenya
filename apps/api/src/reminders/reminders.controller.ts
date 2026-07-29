import { Controller, Post, Get } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Roles(UserRole.ADMIN)
  @Post('trigger-cron')
  async triggerWeeklyReminders() {
    return this.remindersService.triggerWeeklyRemindersJob();
  }

  @Roles(UserRole.ADMIN)
  @Get('status')
  async getRemindersStatus() {
    return this.remindersService.getRemindersStatus();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /** GET /api/reports/daily?date=YYYY-MM-DD&tutorId=... */
  @Roles(UserRole.SCHOOL, UserRole.TUTOR)
  @Get('daily')
  daily(@CurrentUser() user: any, @Query('date') date?: string, @Query('tutorId') tutorId?: string) {
    return this.service.dailyReport({ id: user.id, role: user.role }, { date, tutorId: tutorId || undefined });
  }
}

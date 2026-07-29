import { Controller, Get, Query, Param } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Roles(UserRole.ADMIN)
  @Get('audit-logs')
  async getAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 50;
    return this.auditLogsService.getAuditLogs(entityType, action, take);
  }

  @Roles(UserRole.ADMIN, UserRole.SCHOOL)
  @Get('schools/:schoolId/audit-logs')
  async getSchoolAuditLogs(
    @Param('schoolId') schoolId: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 50;
    return this.auditLogsService.getSchoolAuditLogs(schoolId, take);
  }
}

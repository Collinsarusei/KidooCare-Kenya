import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(entityType?: string, action?: string, limit = 50) {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSchoolAuditLogs(schoolId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: schoolId },
          { entityType: 'School', entityId: schoolId },
          { entityType: 'SchoolPaymentCredentials', entityId: schoolId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyInstallmentStatus } from '@prisma/client';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private prisma: PrismaService) {}

  async triggerWeeklyRemindersJob() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Scan for pending/overdue installments needing reminder emails
    const targetInstallments = await this.prisma.weeklyInstallment.findMany({
      where: {
        status: { in: [WeeklyInstallmentStatus.PENDING, WeeklyInstallmentStatus.OVERDUE] },
        weekStart: { lte: now },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lte: sevenDaysAgo } },
        ],
      },
      include: {
        billingCycle: {
          include: {
            enrollment: {
              include: {
                child: {
                  include: {
                    parent: { select: { id: true, email: true, phone: true } },
                  },
                },
                service: {
                  include: {
                    school: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const sentReminders = [];

    for (const inst of targetInstallments) {
      const parent = inst.billingCycle.enrollment.child.parent;
      const child = inst.billingCycle.enrollment.child;
      const school = inst.billingCycle.enrollment.service.school;
      const amountDue = inst.amountDue - inst.amountPaid;

      // Dispatch notification (Logger / Email Service dispatch simulation)
      this.logger.log(
        `[REMINDER JOB] Dispatched payment reminder email to ${parent.email} for child '${child.name}' at '${school.name}'. Week ${inst.weekNumber} due: KES ${amountDue.toLocaleString()}`
      );

      // Update reminderSentAt timestamp and record audit log
      await this.prisma.$transaction([
        this.prisma.weeklyInstallment.update({
          where: { id: inst.id },
          data: { reminderSentAt: now },
        }),
        this.prisma.auditLog.create({
          data: {
            entityType: 'WeeklyInstallment',
            entityId: inst.id,
            action: 'SEND_WEEKLY_REMINDER',
            actorId: 'BULLMQ_CRON_SCHEDULER',
            afterState: {
              parentEmail: parent.email,
              childName: child.name,
              schoolName: school.name,
              weekNumber: inst.weekNumber,
              amountDue,
              reminderSentAt: now.toISOString(),
            },
          },
        }),
      ]);

      sentReminders.push({
        installmentId: inst.id,
        childName: child.name,
        parentEmail: parent.email,
        amountDue,
        weekNumber: inst.weekNumber,
      });
    }

    return {
      success: true,
      timestamp: now,
      installmentsScanned: targetInstallments.length,
      remindersSentCount: sentReminders.length,
      sentReminders,
    };
  }

  async getRemindersStatus() {
    const pendingRemindersCount = await this.prisma.weeklyInstallment.count({
      where: {
        status: { in: [WeeklyInstallmentStatus.PENDING, WeeklyInstallmentStatus.OVERDUE] },
        reminderSentAt: null,
      },
    });

    const totalSentCount = await this.prisma.auditLog.count({
      where: { action: 'SEND_WEEKLY_REMINDER' },
    });

    return {
      pendingRemindersCount,
      totalSentCount,
    };
  }
}

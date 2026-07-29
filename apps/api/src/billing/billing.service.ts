import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyInstallmentStatus, EnrollmentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async generateBillingCycleForEnrollment(enrollmentId: string, targetDate?: Date) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        child: true,
        service: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${enrollmentId}' not found`);
    }

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException(`Cannot generate billing cycle for non-active enrollment (${enrollment.status})`);
    }

    const refDate = targetDate ? new Date(targetDate) : new Date();
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59);

    // Check if cycle already exists for this month
    const existingCycle = await this.prisma.billingCycle.findFirst({
      where: {
        enrollmentId,
        monthStart: { gte: monthStart },
        monthEnd: { lte: monthEnd },
      },
      include: {
        weeklyInstallments: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    });

    if (existingCycle) {
      return existingCycle;
    }

    const weeksInMonth = 4;
    const totalAmountDue = enrollment.agreedMonthlyPrice;
    
    // Remainder folding math logic (Section 4)
    const baseWeeklyAmount = Math.floor(totalAmountDue / weeksInMonth);
    const remainder = totalAmountDue - (baseWeeklyAmount * weeksInMonth);

    const billingCycle = await this.prisma.$transaction(async (tx) => {
      const cycle = await tx.billingCycle.create({
        data: {
          enrollmentId,
          monthStart,
          monthEnd,
          totalAmountDue,
          weeksInMonth,
        },
      });

      const installmentsData = [];
      const daysPerWeek = 7;

      for (let week = 1; week <= weeksInMonth; week++) {
        const weekStart = new Date(monthStart.getTime() + (week - 1) * daysPerWeek * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + (daysPerWeek * 24 * 60 * 60 * 1000) - 1);

        // Fold remainder into final week
        const amountDue = week === weeksInMonth ? baseWeeklyAmount + remainder : baseWeeklyAmount;

        installmentsData.push({
          billingCycleId: cycle.id,
          weekNumber: week,
          weekStart,
          weekEnd,
          amountDue,
          amountPaid: 0,
          status: WeeklyInstallmentStatus.PENDING,
        });
      }

      await tx.weeklyInstallment.createMany({
        data: installmentsData,
      });

      await tx.auditLog.create({
        data: {
          entityType: 'BillingCycle',
          entityId: cycle.id,
          action: 'GENERATE_WEEKLY_BILLING_CYCLE',
          actorId: enrollment.child.parentId,
          afterState: {
            childName: enrollment.child.name,
            totalAmountDue,
            baseWeeklyAmount,
            remainderFolded: remainder,
            weeksCount: weeksInMonth,
          },
        },
      });

      return cycle;
    });

    return this.getBillingCycleById(billingCycle.id);
  }

  async getBillingCycleForEnrollment(enrollmentId: string) {
    const cycle = await this.prisma.billingCycle.findFirst({
      where: { enrollmentId },
      include: {
        weeklyInstallments: {
          orderBy: { weekNumber: 'asc' },
        },
      },
      orderBy: { monthStart: 'desc' },
    });

    if (!cycle) {
      // Auto-generate if enrollment is active but no cycle exists
      return this.generateBillingCycleForEnrollment(enrollmentId);
    }

    return cycle;
  }

  async getBillingCycleById(id: string) {
    const cycle = await this.prisma.billingCycle.findUnique({
      where: { id },
      include: {
        weeklyInstallments: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    });
    if (!cycle) {
      throw new NotFoundException(`BillingCycle with ID '${id}' not found`);
    }
    return cycle;
  }

  async runMonthlyRollover(targetDate?: Date) {
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: { status: EnrollmentStatus.ACTIVE },
    });

    let cyclesCreated = 0;
    for (const enr of activeEnrollments) {
      await this.generateBillingCycleForEnrollment(enr.id, targetDate);
      cyclesCreated++;
    }

    // Refresh balances & calculate cumulative arrears across months
    const balances = await this.prisma.balance.findMany({
      include: {
        enrollment: {
          include: {
            billingCycles: {
              include: { weeklyInstallments: true },
            },
          },
        },
      },
    });

    for (const b of balances) {
      let totalArrears = 0;
      for (const cycle of b.enrollment.billingCycles) {
        for (const inst of cycle.weeklyInstallments) {
          if (inst.status !== WeeklyInstallmentStatus.PAID) {
            totalArrears += (inst.amountDue - inst.amountPaid);
          }
        }
      }
      await this.prisma.balance.update({
        where: { id: b.id },
        data: { totalArrears, lastCalculatedAt: new Date() },
      });
    }

    return {
      success: true,
      timestamp: new Date(),
      activeEnrollmentsCount: activeEnrollments.length,
      cyclesCreated,
      balancesUpdatedCount: balances.length,
    };
  }
}


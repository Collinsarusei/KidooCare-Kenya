import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyInstallmentStatus, EnrollmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class BalancesService {
  constructor(private prisma: PrismaService) {}

  async recalculateBalance(enrollmentId: string) {
    const unpaidInstallments = await this.prisma.weeklyInstallment.findMany({
      where: {
        billingCycle: { enrollmentId },
        status: { in: [WeeklyInstallmentStatus.PENDING, WeeklyInstallmentStatus.OVERDUE] },
      },
    });

    const totalArrears = unpaidInstallments.reduce(
      (sum, inst) => sum + (inst.amountDue - inst.amountPaid),
      0,
    );

    const balance = await this.prisma.balance.upsert({
      where: { enrollmentId },
      update: {
        totalArrears,
        lastCalculatedAt: new Date(),
      },
      create: {
        enrollmentId,
        totalArrears,
        lastCalculatedAt: new Date(),
      },
    });

    return balance;
  }

  async getParentLedger(parentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        child: { parentId },
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        child: true,
        service: {
          include: {
            school: {
              select: { name: true, location: true },
            },
          },
        },
        balance: true,
        billingCycles: {
          include: {
            weeklyInstallments: {
              orderBy: { weekNumber: 'asc' },
            },
          },
          orderBy: { monthStart: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const childrenLedgers = enrollments.map((enr) => {
      const currentCycle = enr.billingCycles[0];
      const installments = currentCycle ? currentCycle.weeklyInstallments : [];
      const totalWeeksCount = installments.length || 4;
      const paidWeeksCount = installments.filter((i) => i.status === WeeklyInstallmentStatus.PAID).length;
      
      const totalArrears = installments
        .filter((i) => i.status !== WeeklyInstallmentStatus.PAID)
        .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

      // CRITICAL SPEC RULE: Green badge ONLY when ALL weeks in current cycle are PAID
      const isAllWeeksPaid = installments.length > 0 && paidWeeksCount === totalWeeksCount;

      return {
        childId: enr.childId,
        childName: enr.child.name,
        enrollmentId: enr.id,
        schoolName: enr.service.school.name,
        serviceName: enr.service.name,
        agreedMonthlyPrice: enr.agreedMonthlyPrice,
        totalWeeksCount,
        paidWeeksCount,
        totalArrears,
        isAllWeeksPaid,
        weeklyInstallments: installments,
      };
    });

    const totalOverallArrears = childrenLedgers.reduce((sum, c) => sum + c.totalArrears, 0);
    const isAllChildrenPaid = childrenLedgers.length > 0 && childrenLedgers.every((c) => c.isAllWeeksPaid);

    return {
      totalOverallArrears,
      isAllChildrenPaid,
      childrenLedgers,
    };
  }

  async getSchoolFinancialOverview(schoolId: string, actorId: string, actorRole: UserRole) {
    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only access financial overview for your own school');
      }
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        service: { schoolId },
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        child: {
          include: {
            parent: { select: { email: true, phone: true } },
          },
        },
        service: { select: { name: true } },
        balance: true,
        billingCycles: {
          include: {
            weeklyInstallments: true,
          },
          orderBy: { monthStart: 'desc' },
          take: 1,
        },
      },
    });

    let totalRevenueCollected = 0;
    let totalOutstandingArrears = 0;
    let fullyPaidEnrollmentsCount = 0;
    let enrollmentsInArrearsCount = 0;

    const studentRosterLedger = enrollments.map((enr) => {
      const cycle = enr.billingCycles[0];
      const installments = cycle ? cycle.weeklyInstallments : [];
      const totalWeeksCount = installments.length || 4;
      const paidWeeksCount = installments.filter((i) => i.status === WeeklyInstallmentStatus.PAID).length;

      const totalArrears = installments
        .filter((i) => i.status !== WeeklyInstallmentStatus.PAID)
        .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

      const paidAmount = installments.reduce((sum, i) => sum + i.amountPaid, 0);

      totalRevenueCollected += paidAmount;
      totalOutstandingArrears += totalArrears;

      const isFullyPaid = installments.length > 0 && paidWeeksCount === totalWeeksCount;
      if (isFullyPaid) fullyPaidEnrollmentsCount++;
      else enrollmentsInArrearsCount++;

      return {
        enrollmentId: enr.id,
        childName: enr.child.name,
        parentEmail: enr.child.parent.email,
        parentPhone: enr.child.parent.phone,
        serviceName: enr.service.name,
        agreedMonthlyPrice: enr.agreedMonthlyPrice,
        paidWeeksCount,
        totalWeeksCount,
        totalArrears,
        isFullyPaid,
      };
    });

    return {
      schoolId: school.id,
      schoolName: school.name,
      totalRevenueCollected,
      totalOutstandingArrears,
      totalEnrolledChildrenCount: enrollments.length,
      fullyPaidEnrollmentsCount,
      enrollmentsInArrearsCount,
      studentRosterLedger,
    };
  }
}

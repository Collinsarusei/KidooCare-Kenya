import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus, PaymentStatus, SchoolStatus, UserRole, DisputeStatus } from '@prisma/client';

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformAnalytics(months = 6) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [
      totalSchools,
      schoolsByStatus,
      verifiedSchools,
      totalParents,
      totalTutors,
      totalChildren,
      enrollmentsByStatus,
      pendingDocuments,
      totalDocuments,
      openDisputes,
      arrearsAgg,
      completedPayments,
      schoolsCreated,
      parentsCreated,
      activeEnrollments,
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.school.count({ where: { verifiedBadge: true } }),
      this.prisma.user.count({ where: { role: UserRole.PARENT } }),
      this.prisma.user.count({ where: { role: UserRole.TUTOR } }),
      this.prisma.child.count(),
      this.prisma.enrollment.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.schoolDocument.count({ where: { verifiedAt: null } }),
      this.prisma.schoolDocument.count(),
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.balance.aggregate({ _sum: { totalArrears: true } }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.COMPLETED },
        select: {
          amount: true,
          method: true,
          paidAt: true,
          createdAt: true,
          weeklyInstallment: {
            select: {
              billingCycle: {
                select: { enrollment: { select: { service: { select: { school: { select: { id: true, name: true } } } } } } },
              },
            },
          },
        },
      }),
      this.prisma.school.findMany({ select: { createdAt: true } }),
      this.prisma.user.findMany({ where: { role: UserRole.PARENT }, select: { createdAt: true } }),
      this.prisma.enrollment.findMany({
        where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_PAYMENT, EnrollmentStatus.WAITLISTED] } },
        select: { service: { select: { name: true } } },
      }),
    ]);

    // ── Monthly time series ────────────────────────────────────────────────
    const monthly = Array.from({ length: months }, (_, i) => {
      const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const inMonth = (d: Date) => d >= start && d < end;
      const before = (d: Date) => d < end;
      return {
        month: start.toLocaleString('en-US', { month: 'short' }) + ' ' + String(start.getFullYear()).slice(2),
        newSchools: schoolsCreated.filter((s) => inMonth(s.createdAt)).length,
        newParents: parentsCreated.filter((p) => inMonth(p.createdAt)).length,
        schools: schoolsCreated.filter((s) => before(s.createdAt)).length,
        parents: parentsCreated.filter((p) => before(p.createdAt)).length,
        revenue: completedPayments
          .filter((p) => inMonth(p.paidAt ?? p.createdAt))
          .reduce((sum, p) => sum + p.amount, 0),
      };
    });

    // ── Revenue ────────────────────────────────────────────────────────────
    const totalRevenue = completedPayments.reduce((s, p) => s + p.amount, 0);
    const revenueThisMonth = completedPayments
      .filter((p) => (p.paidAt ?? p.createdAt) >= thisMonthStart)
      .reduce((s, p) => s + p.amount, 0);

    const methodMap = new Map<string, number>();
    const schoolRevenue = new Map<string, { name: string; revenue: number }>();
    for (const p of completedPayments) {
      methodMap.set(p.method, (methodMap.get(p.method) || 0) + p.amount);
      const school = p.weeklyInstallment?.billingCycle?.enrollment?.service?.school;
      if (school) {
        const cur = schoolRevenue.get(school.id) || { name: school.name, revenue: 0 };
        cur.revenue += p.amount;
        schoolRevenue.set(school.id, cur);
      }
    }

    // ── Service popularity (grouped by service name across schools) ────────
    const serviceMap = new Map<string, number>();
    for (const e of activeEnrollments) {
      serviceMap.set(e.service.name, (serviceMap.get(e.service.name) || 0) + 1);
    }

    const statusCount = (s: SchoolStatus) => schoolsByStatus.find((x) => x.status === s)?._count._all || 0;
    const enrollCount = (s: EnrollmentStatus) => enrollmentsByStatus.find((x) => x.status === s)?._count._all || 0;

    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        totalSchools,
        activeSchools: statusCount(SchoolStatus.ACTIVE),
        verifiedSchools,
        totalParents,
        totalTutors,
        totalChildren,
        totalUsers: totalParents + totalTutors + totalSchools,
        activeEnrollments: enrollCount(EnrollmentStatus.ACTIVE),
        pendingPaymentEnrollments: enrollCount(EnrollmentStatus.PENDING_PAYMENT),
        waitlistedEnrollments: enrollCount(EnrollmentStatus.WAITLISTED),
        totalRevenue,
        revenueThisMonth,
        outstandingArrears: arrearsAgg._sum.totalArrears || 0,
        pendingDocuments,
        totalDocuments,
        openDisputes,
      },
      monthly,
      schoolStatus: [
        { name: 'Active', value: statusCount(SchoolStatus.ACTIVE) },
        { name: 'Pending Profile', value: statusCount(SchoolStatus.PENDING_PROFILE) },
        { name: 'Suspended', value: statusCount(SchoolStatus.SUSPENDED) },
      ],
      servicePopularity: [...serviceMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      paymentMethods: [...methodMap.entries()].map(([name, value]) => ({ name, value })),
      topSchools: [...schoolRevenue.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }
}

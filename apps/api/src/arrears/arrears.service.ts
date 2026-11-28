import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus, WeeklyInstallmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { PaymentsService } from '../payments/payments.service';

const kes = (n: number) => `KES ${Math.round(n).toLocaleString()}`;

@Injectable()
export class ArrearsService {
  private readonly logger = new Logger(ArrearsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  private async assertOwner(schoolId: string, userId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    if (school.userId !== userId) throw new ForbiddenException('You can only manage arrears for your own school');
    return school;
  }

  /** Children whose due installments (week already started) are not fully paid. */
  async list(schoolId: string, userId: string) {
    await this.assertOwner(schoolId, userId);
    const now = new Date();

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        service: { schoolId },
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_APPROVAL] },
      },
      include: {
        child: { include: { parent: { select: { id: true, name: true, email: true, phone: true } } } },
        service: { select: { name: true } },
        billingCycles: {
          include: {
            weeklyInstallments: {
              where: { status: { not: WeeklyInstallmentStatus.PAID }, weekStart: { lte: now } },
              orderBy: { weekStart: 'asc' },
            },
          },
        },
      },
    });

    const lastReminders = await this.prisma.auditLog.findMany({
      where: { entityType: 'Enrollment', action: { in: ['ARREARS_EMAIL_SENT', 'ARREARS_STK_PROMPT'] }, entityId: { in: enrollments.map((e) => e.id) } },
      orderBy: { createdAt: 'desc' },
    });

    const rows = enrollments
      .map((e) => {
        const due = e.billingCycles.flatMap((c) => c.weeklyInstallments);
        const amount = due.reduce((s, i) => s + Math.max(0, i.amountDue - i.amountPaid), 0);
        if (amount <= 0) return null;
        const oldest = due[0];
        const last = lastReminders.find((r) => r.entityId === e.id);
        return {
          enrollmentId: e.id,
          childId: e.childId,
          childName: e.child.name,
          serviceName: e.service.name,
          parent: e.child.parent,
          isWalkInParent: e.child.parent.email.endsWith('@kiddocare.local'),
          arrears: Math.round(amount * 100) / 100,
          unpaidWeeks: due.length,
          oldestDueDate: oldest?.weekStart ?? null,
          daysOverdue: oldest ? Math.max(0, Math.floor((now.getTime() - oldest.weekEnd.getTime()) / 86400000)) : 0,
          oldestInstallmentId: oldest?.id ?? null,
          oldestInstallmentBalance: oldest ? Math.max(0, oldest.amountDue - oldest.amountPaid) : 0,
          lastReminder: last ? { at: last.createdAt, type: last.action === 'ARREARS_STK_PROMPT' ? 'M-Pesa prompt' : 'Email' } : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.arrears - a.arrears);

    return {
      totalArrears: rows.reduce((s: number, r: any) => s + r.arrears, 0),
      count: rows.length,
      rows,
    };
  }

  private async findRow(schoolId: string, userId: string, enrollmentId: string) {
    const data = await this.list(schoolId, userId);
    const row: any = data.rows.find((r: any) => r.enrollmentId === enrollmentId);
    if (!row) throw new BadRequestException('This enrollment has no arrears');
    return row;
  }

  private async sendEmail(schoolName: string, row: any, actorId: string, note?: string) {
    if (row.isWalkInParent) return { sent: false, message: 'Walk-in parent has no email address' };
    const appUrl = (this.config.get<string>('WEB_APP_URL') || 'http://localhost:5173').replace(/\/$/, '');
    const payUrl = `${appUrl}/?tab=ledger`;
    const result = await this.email.sendNotificationEmail(
      row.parent.email,
      `Fee reminder: ${kes(row.arrears)} due for ${row.childName}`,
      `Hello${row.parent.name ? ` ${row.parent.name}` : ''},`,
      `<p>This is a friendly reminder from <strong>${schoolName}</strong> that <strong>${kes(row.arrears)}</strong> is outstanding for
         <strong>${row.childName}</strong> (${row.serviceName}) — ${row.unpaidWeeks} unpaid week${row.unpaidWeeks === 1 ? '' : 's'}.</p>
       ${note ? `<p style="background:#f8f9ff;border:1px solid #e6eeff;padding:12px;border-radius:10px;">${note.replace(/</g, '&lt;')}</p>` : ''}
       <div style="text-align:center;margin:24px 0;">
         <a href="${payUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block;">Pay with M-Pesa now &rarr;</a>
       </div>
       <p style="font-size:12px;color:#737686;">Log in and open <strong>Financial Ledger</strong> to pay the full amount or one week at a time (Lipa Mdogo Mdogo).
       If you have already paid, please ignore this message.</p>`,
    );
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Enrollment',
        entityId: row.enrollmentId,
        action: 'ARREARS_EMAIL_SENT',
        actorId,
        afterState: { arrears: row.arrears, emailed: result.sent, to: row.parent.email },
      },
    });
    return result;
  }

  async emailOne(schoolId: string, userId: string, enrollmentId: string, note?: string) {
    const school = await this.assertOwner(schoolId, userId);
    const row = await this.findRow(schoolId, userId, enrollmentId);
    const res = await this.sendEmail(school.name, row, userId, note);
    if (!res.sent) throw new BadRequestException(`Email not sent: ${res.message}`);
    return { message: `Payment reminder emailed to ${row.parent.email}` };
  }

  async emailAll(schoolId: string, userId: string, note?: string) {
    const school = await this.assertOwner(schoolId, userId);
    const { rows } = await this.list(schoolId, userId);
    let sent = 0;
    const failed: string[] = [];
    for (const row of rows as any[]) {
      const res = await this.sendEmail(school.name, row, userId, note);
      if (res.sent) sent++;
      else failed.push(`${row.childName} (${res.message})`);
    }
    return { sent, failed, message: `Reminders emailed to ${sent} of ${rows.length} parents` };
  }

  /** School sends an M-Pesa STK prompt to the parent's phone for the oldest unpaid week. */
  async stkPrompt(schoolId: string, userId: string, enrollmentId: string, phone?: string) {
    await this.assertOwner(schoolId, userId);
    const row = await this.findRow(schoolId, userId, enrollmentId);
    if (!row.oldestInstallmentId) throw new BadRequestException('No unpaid installment found');
    const target = (phone || row.parent.phone || '').trim();
    if (!target) throw new BadRequestException('The parent has no phone number on file');

    const result = await this.payments.initiateStkPush(row.parent.id, {
      weeklyInstallmentId: row.oldestInstallmentId,
      phone: target,
      amount: row.oldestInstallmentBalance,
    });
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Enrollment',
        entityId: enrollmentId,
        action: 'ARREARS_STK_PROMPT',
        actorId: userId,
        afterState: { amount: row.oldestInstallmentBalance, phoneLast4: target.slice(-4) },
      },
    });
    return {
      ...result,
      customerMessage: `M-Pesa prompt for ${kes(row.oldestInstallmentBalance)} sent to the parent's phone (…${target.slice(-4)}). The roster updates once they enter their PIN.`,
    };
  }
}

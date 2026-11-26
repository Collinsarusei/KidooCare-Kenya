import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentStatus, PaymentStatus, RefundStatus, UserRole } from '@prisma/client';

import { BillingService } from '../billing/billing.service';
import { EmailService } from '../common/email.service';
import { SmsService } from '../common/sms.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  /** Sum of COMPLETED payments on an enrollment. */
  private async getTotalPaid(enrollmentId: string): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, weeklyInstallment: { billingCycle: { enrollmentId } } },
      _sum: { amount: true },
    });
    return agg._sum.amount || 0;
  }

  private async withTotalPaid<T extends { id: string }>(enrollments: T[]): Promise<(T & { totalPaid: number })[]> {
    return Promise.all(enrollments.map(async (e) => ({ ...e, totalPaid: await this.getTotalPaid(e.id) })));
  }

  /** Loads an enrollment and checks that the actor is the owning school (or an admin). */
  private async getEnrollmentForSchoolAction(enrollmentId: string, actorId: string, actorRole: UserRole) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        service: { include: { school: true } },
        child: { include: { parent: { select: { email: true, phone: true, name: true } } } },
      },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment with ID '${enrollmentId}' not found`);
    if (actorRole === UserRole.SCHOOL && enrollment.service.school.userId !== actorId) {
      throw new ForbiddenException('You can only manage admissions for your own school');
    }
    return enrollment;
  }

  async createEnrollment(parentId: string, dto: CreateEnrollmentDto, opts: { preApproved?: boolean } = {}) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });
    if (!child || child.parentId !== parentId) {
      throw new ForbiddenException('You can only enroll children belonging to your account');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { school: { include: { credentials: true } } },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${dto.serviceId}' not found`);
    }

    if (!service.school.credentials || !service.school.credentials.mpesaShortcode) {
      throw new BadRequestException('This daycare has not configured payment details yet. You cannot enroll at this time.');
    }

    // Check existing active enrollment for this child in this service
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        childId: dto.childId,
        serviceId: dto.serviceId,
        status: {
          in: [
            EnrollmentStatus.ACTIVE,
            EnrollmentStatus.WAITLISTED,
            EnrollmentStatus.PENDING_PAYMENT,
            EnrollmentStatus.PENDING_APPROVAL,
          ],
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Child '${child.name}' already has an application for this program (status: ${existing.status.replace('_', ' ').toLowerCase()})`,
      );
    }

    const isFull = service.currentEnrollmentCount >= service.capacity;
    const initialStatus: EnrollmentStatus = isFull ? EnrollmentStatus.WAITLISTED : EnrollmentStatus.PENDING_PAYMENT;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          childId: dto.childId,
          serviceId: dto.serviceId,
          startDate,
          status: initialStatus,
          agreedMonthlyPrice: service.price, // Snapshot at enrollment time
          // Walk-ins are admitted by the school itself, so they are pre-approved
          ...(opts.preApproved && { admissionApprovedAt: new Date() }),
        },
      });

      if (initialStatus !== EnrollmentStatus.WAITLISTED && initialStatus !== EnrollmentStatus.PENDING_PAYMENT) {
        await tx.service.update({
          where: { id: service.id },
          data: { currentEnrollmentCount: { increment: 1 } },
        });

        await tx.child.update({
          where: { id: child.id },
          data: { schoolId: service.schoolId },
        });
      }

      // Initialize Balance record for this enrollment (even for pending_payment, so billing cycle works)
      if (initialStatus !== EnrollmentStatus.WAITLISTED) {
        await tx.balance.create({
          data: {
            enrollmentId: newEnrollment.id,
            totalArrears: 0,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: newEnrollment.id,
          action: 'CREATE_ENROLLMENT',
          actorId: parentId,
          afterState: {
            childName: child.name,
            serviceName: service.name,
            agreedMonthlyPrice: service.price,
            status: initialStatus,
          },
        },
      });

      return newEnrollment;
    });

    if (initialStatus !== EnrollmentStatus.WAITLISTED) {
        await this.billingService.generateBillingCycleForEnrollment(enrollment.id);
    }

    return this.getEnrollmentById(enrollment.id);
  }

  async getParentEnrollments(parentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        child: { parentId },
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.withTotalPaid(enrollments);
  }

  async getSchoolEnrollments(schoolId: string, actorId: string, actorRole: UserRole) {
    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only view enrollments for your own school');
      }
    } else if (actorRole === UserRole.TUTOR) {
      const tutor = await this.prisma.user.findUnique({ where: { id: actorId } });
      if (!tutor || tutor.employedAtSchoolId !== schoolId) {
        throw new ForbiddenException('You can only view enrollments for your assigned school');
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        service: { schoolId },
      },
      include: {
        child: {
          include: {
            parent: {
              select: { email: true, phone: true, name: true },
            },
          },
        },
        service: true,
        balance: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.withTotalPaid(enrollments);
  }

  async getEnrollmentById(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
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
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${id}' not found`);
    }
    return { ...enrollment, totalPaid: await this.getTotalPaid(id) };
  }

  async promoteWaitlist(enrollmentId: string, actorId: string, actorRole: UserRole) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { service: true, child: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${enrollmentId}' not found`);
    }

    if (enrollment.status !== EnrollmentStatus.WAITLISTED) {
      throw new BadRequestException(`Enrollment is not currently WAITLISTED (current status: ${enrollment.status})`);
    }

    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: enrollment.service.schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only promote waitlist entries for your own school');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.ACTIVE },
      });

      await tx.service.update({
        where: { id: enrollment.serviceId },
        data: { currentEnrollmentCount: { increment: 1 } },
      });

      await tx.child.update({
        where: { id: enrollment.childId },
        data: { schoolId: enrollment.service.schoolId },
      });

      const existingBalance = await tx.balance.findUnique({ where: { enrollmentId } });
      if (!existingBalance) {
        await tx.balance.create({
          data: { enrollmentId, totalArrears: 0 },
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: enrollmentId,
          action: 'PROMOTE_WAITLIST',
          actorId,
          beforeState: { status: EnrollmentStatus.WAITLISTED },
          afterState: { status: EnrollmentStatus.ACTIVE },
        },
      });
    });

    await this.billingService.generateBillingCycleForEnrollment(enrollmentId);

    return this.getEnrollmentById(enrollmentId);
  }

  async endEnrollment(enrollmentId: string, actorId: string, actorRole: UserRole) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { service: true, child: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${enrollmentId}' not found`);
    }

    if (actorRole === UserRole.PARENT && enrollment.child.parentId !== actorId) {
      throw new ForbiddenException('You can only end enrollments for your own children');
    }

    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: enrollment.service.schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only end enrollments for your own school');
      }
    }

    if (actorRole === UserRole.PARENT && enrollment.status === EnrollmentStatus.ACTIVE) {
      const balance = await this.prisma.balance.findUnique({ where: { enrollmentId } });
      if (balance && balance.totalArrears > 0) {
        throw new BadRequestException('You cannot cancel an active enrollment while you have outstanding arrears. Please clear your balance first.');
      }
    }

    const wasActive = enrollment.status === EnrollmentStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.ENDED },
      });

      if (wasActive && enrollment.service.currentEnrollmentCount > 0) {
        await tx.service.update({
          where: { id: enrollment.serviceId },
          data: { currentEnrollmentCount: { decrement: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: enrollmentId,
          action: 'END_ENROLLMENT',
          actorId,
          beforeState: { status: enrollment.status },
          afterState: { status: EnrollmentStatus.ENDED },
        },
      });
    });

    return this.getEnrollmentById(enrollmentId);
  }
  /**
   * Parent removes a program they no longer want, as long as the school has
   * not admitted the child and nothing has been paid for it.
   */
  async deleteUnpaidEnrollment(enrollmentId: string, parentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { child: true },
    });
    if (!enrollment) throw new NotFoundException(`Enrollment with ID '${enrollmentId}' not found`);
    if (enrollment.child.parentId !== parentId) {
      throw new ForbiddenException('You can only remove programs for your own children');
    }

    const deletableStatuses: EnrollmentStatus[] = [
      EnrollmentStatus.PENDING_PAYMENT,
      EnrollmentStatus.WAITLISTED,
      EnrollmentStatus.REJECTED,
      EnrollmentStatus.ENDED,
    ];
    if (!deletableStatuses.includes(enrollment.status)) {
      throw new BadRequestException(
        enrollment.status === EnrollmentStatus.PENDING_APPROVAL
          ? 'This application has been paid and is waiting for the school. Ask the school to reject it if you no longer want it.'
          : 'Active programs cannot be deleted. End the enrollment instead.',
      );
    }
    if (enrollment.admissionApprovedAt && enrollment.status !== EnrollmentStatus.REJECTED) {
      throw new BadRequestException('The school has already admitted your child to this program, so it cannot be deleted.');
    }
    const totalPaid = await this.getTotalPaid(enrollmentId);
    if (totalPaid > 0) {
      throw new BadRequestException(
        `KES ${totalPaid.toLocaleString()} has been paid on this program, so it cannot be deleted. ${
          enrollment.refundStatus === RefundStatus.PENDING ? 'Collect your refund from the school first.' : ''
        }`.trim(),
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.balance.deleteMany({ where: { enrollmentId } });
      await tx.payment.deleteMany({ where: { weeklyInstallment: { billingCycle: { enrollmentId } } } });
      await tx.weeklyInstallment.deleteMany({ where: { billingCycle: { enrollmentId } } });
      await tx.billingCycle.deleteMany({ where: { enrollmentId } });
      await tx.enrollment.delete({ where: { id: enrollmentId } });
      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: enrollmentId,
          action: 'PARENT_DELETE_UNPAID_ENROLLMENT',
          actorId: parentId,
          beforeState: { status: enrollment.status, childId: enrollment.childId, serviceId: enrollment.serviceId },
        },
      });
    });

    return { message: 'Program removed' };
  }

  /** Kept for the old POST /enrollments/:id/cancel route. */
  async cancelPendingEnrollment(enrollmentId: string, parentId: string) {
    return this.deleteUnpaidEnrollment(enrollmentId, parentId);
  }

  /**
   * School admits a child.
   * - PENDING_APPROVAL (parent has paid) → ACTIVE
   * - PENDING_PAYMENT (not yet paid) → stays PENDING_PAYMENT but is pre-approved,
   *   so it becomes ACTIVE automatically as soon as the parent pays.
   */
  async approveAdmission(enrollmentId: string, actorId: string, actorRole: UserRole) {
    const enrollment = await this.getEnrollmentForSchoolAction(enrollmentId, actorId, actorRole);

    if (enrollment.status !== EnrollmentStatus.PENDING_APPROVAL && enrollment.status !== EnrollmentStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`Only applications awaiting approval can be approved (current status: ${enrollment.status})`);
    }

    const activateNow = enrollment.status === EnrollmentStatus.PENDING_APPROVAL;
    if (activateNow) {
      const service = await this.prisma.service.findUnique({ where: { id: enrollment.serviceId } });
      if (service && service.currentEnrollmentCount >= service.capacity) {
        throw new BadRequestException(
          `${service.name} is full (${service.currentEnrollmentCount}/${service.capacity}). Increase the program capacity or reject the application.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          admissionApprovedAt: new Date(),
          decidedById: actorId,
          ...(activateNow && { status: EnrollmentStatus.ACTIVE }),
        },
      });
      if (activateNow) {
        await tx.service.update({ where: { id: enrollment.serviceId }, data: { currentEnrollmentCount: { increment: 1 } } });
        await tx.child.update({ where: { id: enrollment.childId }, data: { schoolId: enrollment.service.schoolId } });
      }
      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: enrollmentId,
          action: 'APPROVE_ADMISSION',
          actorId,
          beforeState: { status: enrollment.status },
          afterState: { status: activateNow ? EnrollmentStatus.ACTIVE : enrollment.status, approved: true },
        },
      });
    });

    const schoolName = enrollment.service.school.name;
    await this.emailService.sendNotificationEmail(
      enrollment.child.parent.email,
      `Admission approved: ${enrollment.child.name} at ${schoolName}`,
      `${enrollment.child.name} has been admitted 🎉`,
      `<p><strong>${schoolName}</strong> has approved ${enrollment.child.name}'s admission to <strong>${enrollment.service.name}</strong>.</p>
       <p>${activateNow ? 'The enrollment is now active.' : 'Complete your first payment in the app to activate the enrollment.'}</p>`,
    );

    return this.getEnrollmentById(enrollmentId);
  }

  /**
   * School rejects an application. Anything the parent already paid becomes a
   * refund the school owes; the parent is notified to collect it.
   */
  async rejectAdmission(enrollmentId: string, actorId: string, actorRole: UserRole, reason: string) {
    const enrollment = await this.getEnrollmentForSchoolAction(enrollmentId, actorId, actorRole);

    const rejectable: EnrollmentStatus[] = [
      EnrollmentStatus.PENDING_APPROVAL,
      EnrollmentStatus.PENDING_PAYMENT,
      EnrollmentStatus.WAITLISTED,
    ];
    if (!rejectable.includes(enrollment.status)) {
      throw new BadRequestException(
        enrollment.status === EnrollmentStatus.ACTIVE
          ? 'This child is already admitted. Use "End Enrollment" instead.'
          : `This application cannot be rejected (current status: ${enrollment.status})`,
      );
    }

    const refundAmount = await this.getTotalPaid(enrollmentId);
    const cleanReason = reason?.trim() || 'No reason given';

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: cleanReason,
          decidedById: actorId,
          admissionApprovedAt: null,
          refundAmount,
          refundStatus: refundAmount > 0 ? RefundStatus.PENDING : RefundStatus.NOT_REQUIRED,
        },
      });
      // Stop billing the parent for a program they were not admitted to
      await tx.balance.updateMany({ where: { enrollmentId }, data: { totalArrears: 0, lastCalculatedAt: new Date() } });
      await tx.auditLog.create({
        data: {
          entityType: 'Enrollment',
          entityId: enrollmentId,
          action: 'REJECT_ADMISSION',
          actorId,
          beforeState: { status: enrollment.status },
          afterState: { status: EnrollmentStatus.REJECTED, reason: cleanReason, refundAmount },
        },
      });
    });

    const schoolName = enrollment.service.school.name;
    const refundText =
      refundAmount > 0
        ? `<p style="background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px;color:#9a3412;">
             You paid <strong>KES ${refundAmount.toLocaleString()}</strong>. Please contact or visit <strong>${schoolName}</strong> to collect your refund.
           </p>`
        : '<p>No payment had been made, so no refund is due.</p>';
    await this.emailService.sendNotificationEmail(
      enrollment.child.parent.email,
      `Admission not approved: ${enrollment.child.name} at ${schoolName}`,
      `Update on ${enrollment.child.name}'s application`,
      `<p><strong>${schoolName}</strong> was not able to admit ${enrollment.child.name} to <strong>${enrollment.service.name}</strong>.</p>
       <p><strong>Reason:</strong> ${cleanReason}</p>${refundText}`,
    );
    if (refundAmount > 0) {
      await this.smsService.sendParentHealthAlert(
        enrollment.child.parent.phone,
        enrollment.child.name,
        `KiddoCare: ${schoolName} did not approve ${enrollment.child.name}'s admission. Please collect your refund of KES ${refundAmount.toLocaleString()} from the school.`,
      );
    }

    return this.getEnrollmentById(enrollmentId);
  }

  /** School confirms the refund for a rejected application has been paid back. */
  async markRefundIssued(enrollmentId: string, actorId: string, actorRole: UserRole, note?: string) {
    const enrollment = await this.getEnrollmentForSchoolAction(enrollmentId, actorId, actorRole);
    if (enrollment.status !== EnrollmentStatus.REJECTED || enrollment.refundStatus !== RefundStatus.PENDING) {
      throw new BadRequestException('There is no pending refund on this application');
    }

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { refundStatus: RefundStatus.REFUNDED, refundedAt: new Date(), refundNote: note?.trim() || null },
    });
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Enrollment',
        entityId: enrollmentId,
        action: 'REFUND_ISSUED',
        actorId,
        afterState: { refundAmount: enrollment.refundAmount, note: note || null },
      },
    });

    await this.emailService.sendNotificationEmail(
      enrollment.child.parent.email,
      `Refund recorded by ${enrollment.service.school.name}`,
      'Your refund has been recorded',
      `<p>${enrollment.service.school.name} has recorded a refund of <strong>KES ${enrollment.refundAmount.toLocaleString()}</strong> for ${enrollment.child.name}'s application.</p>
       ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
       <p>If you have not received it, please contact the school or raise a dispute in the app.</p>`,
    );

    return this.getEnrollmentById(enrollmentId);
  }

  async createWalkInEnrollment(
    schoolId: string,
    actorId: string,
    actorRole: UserRole,
    dto: {
      childName: string;
      childDob: string;
      parentName?: string;
      parentEmail?: string;
      parentPhone?: string;
      serviceId: string;
    },
  ) {
    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only add walk-ins to your own school');
      }
    } else if (actorRole === UserRole.TUTOR) {
      const tutor = await this.prisma.user.findUnique({ where: { id: actorId } });
      if (!tutor || tutor.employedAtSchoolId !== schoolId) {
        throw new ForbiddenException('You can only add walk-ins to your employed school');
      }
    }

    const service = await this.prisma.service.findUnique({ 
      where: { id: dto.serviceId },
      include: { school: { include: { credentials: true } } }
    });
    if (!service || service.schoolId !== schoolId) {
      throw new BadRequestException('Invalid service for this school');
    }

    if (!service.school.credentials || !service.school.credentials.mpesaShortcode) {
      throw new BadRequestException('This daycare has not configured payment details yet. You cannot enroll walk-ins at this time.');
    }

    let parentId = '';
    
    if (dto.parentEmail) {
      let parentUser = await this.prisma.user.findUnique({ where: { email: dto.parentEmail } });
      if (!parentUser) {
        const passwordHash = await require('bcrypt').hash('Walkin@123', 10);
        parentUser = await this.prisma.user.create({
          data: {
            email: dto.parentEmail,
            phone: dto.parentPhone || '0000000000',
            role: UserRole.PARENT,
            passwordHash,
            mustChangePassword: true,
          }
        });
      }
      parentId = parentUser.id;
    } else {
      const stubEmail = `stub-${Date.now()}@kiddocare.local`;
      const passwordHash = await require('bcrypt').hash('Walkin@123', 10);
      const parentUser = await this.prisma.user.create({
        data: {
          email: stubEmail,
          phone: dto.parentPhone || '0000000000',
          role: UserRole.PARENT,
          passwordHash,
          mustChangePassword: true,
        }
      });
      parentId = parentUser.id;
    }

    const child = await this.prisma.child.create({
      data: {
        parentId,
        name: dto.childName,
        dob: new Date(dto.childDob),
        schoolId,
      }
    });

    return this.createEnrollment(parentId, { childId: child.id, serviceId: dto.serviceId }, { preApproved: true });
  }
}


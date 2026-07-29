import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentStatus, UserRole } from '@prisma/client';

import { BillingService } from '../billing/billing.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async createEnrollment(parentId: string, dto: CreateEnrollmentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });
    if (!child || child.parentId !== parentId) {
      throw new ForbiddenException('You can only enroll children belonging to your account');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { school: true },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${dto.serviceId}' not found`);
    }

    // Check existing active enrollment for this child in this service
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        childId: dto.childId,
        serviceId: dto.serviceId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.WAITLISTED] },
      },
    });
    if (existing) {
      throw new BadRequestException(`Child '${child.name}' is already enrolled or waitlisted for this service`);
    }

    const isFull = service.currentEnrollmentCount >= service.capacity;
    const initialStatus = isFull ? EnrollmentStatus.WAITLISTED : EnrollmentStatus.ACTIVE;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          childId: dto.childId,
          serviceId: dto.serviceId,
          startDate,
          status: initialStatus,
          agreedMonthlyPrice: service.price, // Snapshot at enrollment time
        },
      });

      if (initialStatus === EnrollmentStatus.ACTIVE) {
        await tx.service.update({
          where: { id: service.id },
          data: { currentEnrollmentCount: { increment: 1 } },
        });

        await tx.child.update({
          where: { id: child.id },
          data: { schoolId: service.schoolId },
        });

        // Initialize Balance record for this enrollment
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

    if (initialStatus === EnrollmentStatus.ACTIVE) {
      await this.billingService.generateBillingCycleForEnrollment(enrollment.id);
    }

    return this.getEnrollmentById(enrollment.id);
  }

  async getParentEnrollments(parentId: string) {
    return this.prisma.enrollment.findMany({
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
  }

  async getSchoolEnrollments(schoolId: string, actorId: string, actorRole: UserRole) {
    if (actorRole === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
      if (!school || school.userId !== actorId) {
        throw new ForbiddenException('You can only view enrollments for your own school');
      }
    }

    return this.prisma.enrollment.findMany({
      where: {
        service: { schoolId },
      },
      include: {
        child: {
          include: {
            parent: {
              select: { email: true, phone: true },
            },
          },
        },
        service: true,
        balance: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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
    return enrollment;
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
}


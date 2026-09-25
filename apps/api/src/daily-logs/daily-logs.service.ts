import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChildHealthStatus, DailyLogMood, UserRole } from '@prisma/client';
import { SmsService } from '../common/sms.service';

@Injectable()
export class DailyLogsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  async createDailyLog(
    tutorId: string,
    childId: string,
    dto: {
      isPresent: boolean;
      mood: DailyLogMood;
      achievements?: string[];
      milestones?: string[];
      allergiesSpotted?: string;
      assignments?: string;
      assessmentType?: string;
      assessmentResult?: string;
      behavior?: string;
      healthStatus?: ChildHealthStatus;
      healthNotes?: string;
      requiresPickup?: boolean;
      hospitalName?: string;
      hospitalNotes?: string;
    }
  ) {
    // Verify tutor exists and is a tutor
    const tutor = await this.prisma.user.findUnique({ where: { id: tutorId } });
    if (!tutor || tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can create daily logs');
    }

    // Verify child exists
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: { select: { phone: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { service: { select: { schoolId: true } } },
        },
      },
    });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.enrollments.some((enrollment) => enrollment.service.schoolId === tutor.employedAtSchoolId)) {
      throw new ForbiddenException('You can only log children enrolled at your daycare');
    }

    const healthStatus = dto.healthStatus || ChildHealthStatus.WELL;
    const requiresHealthAlert = dto.requiresPickup || healthStatus === ChildHealthStatus.EMERGENCY || healthStatus === ChildHealthStatus.HOSPITALIZED;
    const log = await this.prisma.dailyLog.create({
      data: {
        tutorId,
        childId,
        isPresent: dto.isPresent,
        mood: dto.mood,
        achievements: dto.achievements || [],
        milestones: dto.milestones || [],
        allergiesSpotted: dto.allergiesSpotted,
        assignments: dto.assignments,
        assessmentType: dto.assessmentType,
        assessmentResult: dto.assessmentResult,
        behavior: dto.behavior,
        healthStatus,
        healthNotes: dto.healthNotes,
        requiresPickup: dto.requiresPickup || false,
        hospitalName: dto.hospitalName,
        hospitalNotes: dto.hospitalNotes,
      },
    });

    if (requiresHealthAlert) {
      const location = healthStatus === ChildHealthStatus.HOSPITALIZED
        ? `taken to ${dto.hospitalName || 'hospital'}`
        : dto.requiresPickup
          ? 'needs to be picked up from the daycare'
          : 'needs urgent medical attention';
      const sent = await this.smsService.sendParentHealthAlert(
        child.parent.phone,
        child.name,
        `KiddoCare alert: ${child.name} ${location}. ${dto.healthNotes || 'Please contact the daycare immediately.'}`,
      );
      if (sent) {
        return this.prisma.dailyLog.update({
          where: { id: log.id },
          data: { parentSmsSentAt: new Date() },
        });
      }
    }

    return log;
  }

  async getLogsByChildId(childId: string, parentId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.dailyLog.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: { select: { email: true, phone: true } }
      }
    });
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChildHealthStatus, DailyLogMood, EnrollmentStatus, UserRole } from '@prisma/client';
import { SmsService } from '../common/sms.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

const tutorSelect = { select: { id: true, email: true, phone: true, name: true } };

@Injectable()
export class DailyLogsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  private todayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private async getTutorSchoolId(tutorId: string): Promise<string> {
    const tutor = await this.prisma.user.findUnique({ where: { id: tutorId } });
    if (!tutor || tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can manage daily logs');
    }
    if (!tutor.employedAtSchoolId) {
      throw new ForbiddenException('You are not assigned to a daycare');
    }
    return tutor.employedAtSchoolId;
  }

  private async getChildAtSchool(childId: string, schoolId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: { select: { phone: true } },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          include: { service: { select: { schoolId: true } } },
        },
      },
    });
    if (!child) throw new NotFoundException('Child not found');
    if (!child.enrollments.some((e) => e.service.schoolId === schoolId)) {
      throw new ForbiddenException('You can only log children enrolled at your daycare');
    }
    return child;
  }

  /**
   * One log per child per day. Morning attendance and an afternoon update
   * (mood, notes, health, pickup) all land on the same record.
   */
  async upsertTodayLog(tutorId: string, childId: string, dto: CreateDailyLogDto) {
    const schoolId = await this.getTutorSchoolId(tutorId);
    const child = await this.getChildAtSchool(childId, schoolId);

    if (!dto.isPresent && dto.requiresPickup) {
      throw new BadRequestException('A pickup can only be requested for a child who is present');
    }

    const { start, end } = this.todayRange();
    const existing = await this.prisma.dailyLog.findFirst({
      where: { childId, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'desc' },
    });

    const data: any = { tutorId, isPresent: dto.isPresent };

    if (!dto.isPresent) {
      // Absent: nothing about mood/health/pickup applies today
      Object.assign(data, {
        mood: null,
        healthStatus: ChildHealthStatus.WELL,
        requiresPickup: false,
        pickupAcknowledgedAt: null,
        pickedUpAt: null,
      });
    } else if (dto.attendanceOnly) {
      if (!existing?.mood) data.mood = DailyLogMood.HAPPY;
    } else {
      Object.assign(data, {
        mood: dto.mood ?? existing?.mood ?? DailyLogMood.HAPPY,
        achievements: dto.achievements ?? existing?.achievements ?? [],
        milestones: dto.milestones ?? existing?.milestones ?? [],
        allergiesSpotted: dto.allergiesSpotted ?? null,
        assignments: dto.assignments ?? null,
        assessmentType: dto.assessmentType ?? null,
        assessmentResult: dto.assessmentResult ?? null,
        behavior: dto.behavior ?? null,
        healthStatus: dto.healthStatus ?? ChildHealthStatus.WELL,
        healthNotes: dto.healthNotes ?? null,
        requiresPickup: !!dto.requiresPickup,
        hospitalName: dto.hospitalName ?? null,
        hospitalNotes: dto.hospitalNotes ?? null,
      });
      if (!dto.requiresPickup) {
        data.pickupAcknowledgedAt = null;
        data.pickedUpAt = null;
      } else if (!existing?.requiresPickup) {
        // fresh pickup request
        data.pickupAcknowledgedAt = null;
        data.pickedUpAt = null;
      }
    }

    const log = existing
      ? await this.prisma.dailyLog.update({ where: { id: existing.id }, data })
      : await this.prisma.dailyLog.create({ data: { ...data, childId } });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'DailyLog',
        entityId: log.id,
        action: existing ? 'UPDATE_DAILY_LOG' : 'CREATE_DAILY_LOG',
        actorId: tutorId,
        afterState: {
          childId,
          isPresent: log.isPresent,
          healthStatus: log.healthStatus,
          requiresPickup: log.requiresPickup,
        },
      },
    });

    // SMS only when an alert is NEW (avoid re-texting the parent on every edit)
    const isAlert = (l: { requiresPickup: boolean; healthStatus: ChildHealthStatus }) =>
      l.requiresPickup || l.healthStatus === ChildHealthStatus.EMERGENCY || l.healthStatus === ChildHealthStatus.HOSPITALIZED;
    const alertIsNew =
      dto.isPresent &&
      !dto.attendanceOnly &&
      isAlert(log) &&
      (!existing || !isAlert(existing) || existing.healthStatus !== log.healthStatus || existing.requiresPickup !== log.requiresPickup);

    if (alertIsNew) {
      const action =
        log.healthStatus === ChildHealthStatus.HOSPITALIZED
          ? `has been taken to ${log.hospitalName || 'hospital'}`
          : log.requiresPickup
          ? 'needs to be picked up from the daycare'
          : 'needs urgent medical attention';
      const sent = await this.smsService.sendParentHealthAlert(
        child.parent.phone,
        child.name,
        `KiddoCare alert: ${child.name} ${action}. ${log.healthNotes || 'Please contact the daycare immediately.'}`,
      );
      if (sent) {
        return this.prisma.dailyLog.update({ where: { id: log.id }, data: { parentSmsSentAt: new Date() } });
      }
    }

    return log;
  }

  async getTodayLogsForTutor(tutorId: string) {
    const schoolId = await this.getTutorSchoolId(tutorId);
    const { start, end } = this.todayRange();
    return this.prisma.dailyLog.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        child: { enrollments: { some: { service: { schoolId } } } },
      },
      include: { child: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async markPickedUp(logId: string, tutorId: string) {
    const schoolId = await this.getTutorSchoolId(tutorId);
    const log = await this.prisma.dailyLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log not found');
    await this.getChildAtSchool(log.childId, schoolId);
    if (!log.requiresPickup) throw new BadRequestException('No pickup was requested for this child');

    const updated = await this.prisma.dailyLog.update({ where: { id: logId }, data: { pickedUpAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { entityType: 'DailyLog', entityId: logId, action: 'CHILD_PICKED_UP', actorId: tutorId },
    });
    return updated;
  }

  async getOpenPickupRequests(parentId: string) {
    return this.prisma.dailyLog.findMany({
      where: {
        requiresPickup: true,
        pickedUpAt: null,
        child: { parentId },
        createdAt: { gte: this.todayRange().start },
      },
      include: {
        tutor: tutorSelect,
        child: { select: { id: true, name: true, school: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async acknowledgePickup(logId: string, parentId: string) {
    const log = await this.prisma.dailyLog.findUnique({ where: { id: logId }, include: { child: true } });
    if (!log || log.child.parentId !== parentId) throw new ForbiddenException('Access denied');
    if (!log.requiresPickup) throw new BadRequestException('No pickup was requested');
    return this.prisma.dailyLog.update({ where: { id: logId }, data: { pickupAcknowledgedAt: new Date() } });
  }

  async getLogsByChildId(childId: string, parentId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.dailyLog.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      include: { tutor: tutorSelect },
    });
  }
}

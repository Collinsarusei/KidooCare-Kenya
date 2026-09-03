import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DailyLogMood, UserRole } from '@prisma/client';

@Injectable()
export class DailyLogsService {
  constructor(private prisma: PrismaService) {}

  async createDailyLog(
    tutorId: string,
    childId: string,
    dto: {
      isPresent: boolean;
      mood: DailyLogMood;
      achievements: string[];
      milestones: string[];
      allergiesSpotted?: string;
      assignments?: string;
    }
  ) {
    // Verify tutor exists and is a tutor
    const tutor = await this.prisma.user.findUnique({ where: { id: tutorId } });
    if (!tutor || tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can create daily logs');
    }

    // Verify child exists
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return this.prisma.dailyLog.create({
      data: {
        tutorId,
        childId,
        isPresent: dto.isPresent,
        mood: dto.mood,
        achievements: dto.achievements,
        milestones: dto.milestones,
        allergiesSpotted: dto.allergiesSpotted,
        assignments: dto.assignments,
      },
    });
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

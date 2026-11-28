import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './assessment.dto';

const include = {
  child: { select: { id: true, name: true } },
  tutor: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  private async tutorSchoolId(tutorId: string) {
    const tutor = await this.prisma.user.findUnique({ where: { id: tutorId } });
    if (!tutor || tutor.role !== UserRole.TUTOR || !tutor.employedAtSchoolId) {
      throw new ForbiddenException('Only tutors assigned to a daycare can record assessments');
    }
    return tutor.employedAtSchoolId;
  }

  async create(tutorId: string, dto: CreateAssessmentDto) {
    const schoolId = await this.tutorSchoolId(tutorId);
    const enrolled = await this.prisma.enrollment.count({
      where: { childId: dto.childId, status: EnrollmentStatus.ACTIVE, service: { schoolId } },
    });
    if (!enrolled) throw new ForbiddenException('This child is not actively enrolled at your daycare');
    if (dto.score !== undefined && dto.maxScore !== undefined && dto.score > dto.maxScore) {
      throw new BadRequestException('Score cannot be higher than the maximum score');
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        childId: dto.childId,
        tutorId,
        schoolId,
        title: dto.title.trim(),
        subject: dto.subject?.trim() || null,
        score: dto.score ?? null,
        maxScore: dto.maxScore ?? null,
        grade: dto.grade?.trim() || null,
        remarks: dto.remarks?.trim() || null,
        assessedOn: dto.assessedOn ? new Date(dto.assessedOn) : new Date(),
      },
      include,
    });
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Assessment',
        entityId: assessment.id,
        action: 'CREATE_ASSESSMENT',
        actorId: tutorId,
        afterState: { childId: dto.childId, title: assessment.title, score: assessment.score, grade: assessment.grade },
      },
    });
    return assessment;
  }

  async listForTutor(tutorId: string) {
    const schoolId = await this.tutorSchoolId(tutorId);
    return this.prisma.assessment.findMany({
      where: { schoolId },
      include,
      orderBy: [{ assessedOn: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  async listForSchool(schoolOwnerId: string, schoolId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school || school.userId !== schoolOwnerId) throw new ForbiddenException('Access denied');
    return this.prisma.assessment.findMany({ where: { schoolId }, include, orderBy: { assessedOn: 'desc' }, take: 500 });
  }

  async listForParentChild(parentId: string, childId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenException('Access denied');
    return this.prisma.assessment.findMany({ where: { childId }, include, orderBy: { assessedOn: 'desc' } });
  }

  async remove(tutorId: string, id: string) {
    const a = await this.prisma.assessment.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Assessment not found');
    if (a.tutorId !== tutorId) throw new ForbiddenException('You can only delete assessments you recorded');
    await this.prisma.assessment.delete({ where: { id } });
    return { message: 'Assessment deleted' };
  }
}

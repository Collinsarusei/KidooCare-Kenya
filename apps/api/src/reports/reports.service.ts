import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DAY = 24 * 60 * 60 * 1000;

const ageLabel = (dob: Date, at: Date) => {
  const months = (at.getFullYear() - dob.getFullYear()) * 12 + (at.getMonth() - dob.getMonth());
  if (months < 24) return `${Math.max(0, months)} months`;
  return `${Math.floor(months / 12)} yrs ${months % 12} mo`;
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private parseDate(date?: string) {
    if (!date) {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) throw new BadRequestException('date must be YYYY-MM-DD');
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /**
   * Daily report.
   * - TUTOR: logs/assessments the tutor recorded that day (for children at their daycare)
   * - SCHOOL: every actively enrolled child; optionally only one tutor's logs
   * Each child includes 30-day progress: attendance rate, milestones, recent assessments.
   */
  async dailyReport(actor: { id: string; role: UserRole }, opts: { date?: string; tutorId?: string; schoolId?: string }) {
    const start = this.parseDate(opts.date);
    const end = new Date(start.getTime() + DAY);
    const since = new Date(start.getTime() - 29 * DAY);

    let schoolId: string;
    let tutorId: string | undefined;

    if (actor.role === UserRole.TUTOR) {
      const tutor = await this.prisma.user.findUnique({ where: { id: actor.id } });
      if (!tutor?.employedAtSchoolId) throw new ForbiddenException('You are not assigned to a daycare');
      schoolId = tutor.employedAtSchoolId;
      tutorId = actor.id;
    } else if (actor.role === UserRole.SCHOOL) {
      const school = await this.prisma.school.findUnique({ where: { userId: actor.id } });
      if (!school || (opts.schoolId && opts.schoolId !== school.id)) throw new ForbiddenException('Access denied');
      schoolId = school.id;
      if (opts.tutorId) {
        const t = await this.prisma.user.findUnique({ where: { id: opts.tutorId } });
        if (!t || t.employedAtSchoolId !== schoolId) throw new ForbiddenException('That tutor does not work at your daycare');
        tutorId = opts.tutorId;
      }
    } else {
      throw new ForbiddenException('Reports are available to schools and tutors');
    }

    const [school, tutor, enrollments] = await Promise.all([
      this.prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, location: true } }),
      tutorId ? this.prisma.user.findUnique({ where: { id: tutorId }, select: { id: true, name: true, email: true } }) : null,
      this.prisma.enrollment.findMany({
        where: { status: EnrollmentStatus.ACTIVE, service: { schoolId } },
        include: { child: true, service: { select: { name: true } } },
        orderBy: { child: { name: 'asc' } },
      }),
    ]);

    // one row per child (a child may be in several programs)
    const childMap = new Map<string, { child: any; programs: string[] }>();
    for (const e of enrollments) {
      const cur = childMap.get(e.childId) || { child: e.child, programs: [] };
      cur.programs.push(e.service.name);
      childMap.set(e.childId, cur);
    }
    const childIds = [...childMap.keys()];

    const [dayLogs, dayAssessments, monthLogs, monthAssessments] = await Promise.all([
      this.prisma.dailyLog.findMany({
        where: { childId: { in: childIds }, createdAt: { gte: start, lt: end }, ...(tutorId && { tutorId }) },
        include: { tutor: { select: { name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.assessment.findMany({
        where: { schoolId, childId: { in: childIds }, assessedOn: { gte: start, lt: end }, ...(tutorId && { tutorId }) },
        orderBy: { assessedOn: 'asc' },
      }),
      this.prisma.dailyLog.findMany({
        where: { childId: { in: childIds }, createdAt: { gte: since, lt: end } },
        select: { childId: true, isPresent: true, milestones: true, achievements: true, createdAt: true },
      }),
      this.prisma.assessment.findMany({
        where: { childId: { in: childIds }, assessedOn: { gte: since, lt: end } },
        orderBy: { assessedOn: 'desc' },
      }),
    ]);

    // A tutor's report only lists children that tutor logged/assessed that day
    const includedIds =
      tutorId != null
        ? childIds.filter((id) => dayLogs.some((l) => l.childId === id) || dayAssessments.some((a) => a.childId === id))
        : childIds;

    const children = includedIds.map((id) => {
      const { child, programs } = childMap.get(id)!;
      const log = dayLogs.find((l) => l.childId === id) || null;
      const month = monthLogs.filter((l) => l.childId === id);
      const presentDays = month.filter((l) => l.isPresent).length;
      const milestones30d = month
        .flatMap((l) => l.milestones.map((m) => ({ date: l.createdAt, text: m })))
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      const achievements30d = month.reduce((n, l) => n + l.achievements.length, 0);
      const recent = monthAssessments.filter((a) => a.childId === id);
      const scored = recent.filter((a) => a.score != null && a.maxScore);
      const avgPct = scored.length
        ? Math.round((scored.reduce((s, a) => s + (a.score! / a.maxScore!) * 100, 0) / scored.length) * 10) / 10
        : null;

      return {
        childId: id,
        name: child.name,
        age: ageLabel(child.dob, start),
        programs,
        log: log && {
          isPresent: log.isPresent,
          mood: log.mood,
          achievements: log.achievements,
          milestones: log.milestones,
          behavior: log.behavior,
          assignments: log.assignments,
          allergiesSpotted: log.allergiesSpotted,
          healthStatus: log.healthStatus,
          healthNotes: log.healthNotes,
          requiresPickup: log.requiresPickup,
          pickedUpAt: log.pickedUpAt,
          tutorName: log.tutor?.name || log.tutor?.email || null,
          loggedAt: log.updatedAt,
        },
        assessmentsToday: dayAssessments
          .filter((a) => a.childId === id)
          .map((a) => ({ title: a.title, subject: a.subject, score: a.score, maxScore: a.maxScore, grade: a.grade, remarks: a.remarks })),
        progress: {
          daysLogged30d: month.length,
          presentDays30d: presentDays,
          attendanceRate30d: month.length ? Math.round((presentDays / month.length) * 100) : null,
          achievements30d,
          milestones30d: milestones30d.slice(0, 10),
          milestoneCount30d: milestones30d.length,
          assessmentAverage30d: avgPct,
          recentAssessments: recent.slice(0, 5).map((a) => ({
            date: a.assessedOn,
            title: a.title,
            subject: a.subject,
            score: a.score,
            maxScore: a.maxScore,
            grade: a.grade,
          })),
        },
      };
    });

    const logged = children.filter((c) => c.log);
    return {
      date: start.toISOString().slice(0, 10),
      dateLabel: start.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      generatedAt: new Date().toISOString(),
      school,
      tutor,
      scope: tutorId ? 'TUTOR' : 'ALL',
      summary: {
        totalChildren: children.length,
        present: logged.filter((c) => c.log!.isPresent).length,
        absent: logged.filter((c) => !c.log!.isPresent).length,
        notLogged: children.length - logged.length,
        pickups: logged.filter((c) => c.log!.requiresPickup).length,
        healthIncidents: logged.filter((c) => c.log!.healthStatus !== 'WELL').length,
        milestonesToday: logged.reduce((n, c) => n + c.log!.milestones.length, 0),
        assessmentsToday: dayAssessments.filter((a) => includedIds.includes(a.childId)).length,
      },
      children,
    };
  }
}

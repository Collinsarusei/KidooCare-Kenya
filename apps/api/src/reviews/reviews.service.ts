import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const parentSelect = { select: { email: true, name: true } };
const displayName = (p: { email: string; name: string | null }) => p.name?.trim() || p.email.split('@')[0];

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /** Only parents whose child has been admitted to the daycare (now or in the past) may review it. */
  private async hasAttended(parentId: string, schoolId: string) {
    const count = await this.prisma.enrollment.count({
      where: {
        child: { parentId },
        service: { schoolId },
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.ENDED] },
      },
    });
    return count > 0;
  }

  async getMyReviewStatus(parentId: string, schoolId: string) {
    const [attended, existing] = await Promise.all([
      this.hasAttended(parentId, schoolId),
      this.prisma.review.findFirst({ where: { parentId, schoolId }, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      canReview: attended,
      reason: attended ? null : 'Only parents whose child has attended this daycare can leave a review.',
      myReview: existing ? { id: existing.id, rating: existing.rating, comment: existing.comment, createdAt: existing.createdAt } : null,
    };
  }

  /** One review per parent per daycare — submitting again updates it. */
  async createReview(parentId: string, dto: CreateReviewDto) {
    const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${dto.schoolId}' not found`);
    }
    if (!(await this.hasAttended(parentId, dto.schoolId))) {
      throw new ForbiddenException('You can only review a daycare your child has attended.');
    }

    const existing = await this.prisma.review.findFirst({ where: { parentId, schoolId: dto.schoolId } });
    const data = { rating: dto.rating, comment: dto.comment.trim() };
    const review = existing
      ? await this.prisma.review.update({ where: { id: existing.id }, data, include: { parent: parentSelect } })
      : await this.prisma.review.create({
          data: { ...data, schoolId: dto.schoolId, parentId },
          include: { parent: parentSelect },
        });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Review',
        entityId: review.id,
        action: existing ? 'UPDATE_REVIEW' : 'CREATE_REVIEW',
        actorId: parentId,
        afterState: { schoolId: dto.schoolId, rating: dto.rating },
      },
    });

    return {
      id: review.id,
      schoolId: review.schoolId,
      parentId: review.parentId,
      parentName: displayName(review.parent),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updated: !!existing,
    };
  }

  async getSchoolReviews(schoolId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { schoolId },
      include: { parent: parentSelect },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalReviews > 0 ? parseFloat((sum / totalReviews).toFixed(1)) : 0;

    return {
      schoolId,
      averageRating,
      totalReviews,
      reviews: reviews.map((r) => ({
        id: r.id,
        schoolId: r.schoolId,
        parentId: r.parentId,
        parentName: displayName(r.parent),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }
}

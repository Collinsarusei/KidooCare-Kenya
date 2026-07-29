import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(parentId: string, dto: CreateReviewDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID '${dto.schoolId}' not found`);
    }

    const review = await this.prisma.review.create({
      data: {
        schoolId: dto.schoolId,
        parentId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        parent: {
          select: { email: true },
        },
      },
    });

    return {
      id: review.id,
      schoolId: review.schoolId,
      parentId: review.parentId,
      parentName: review.parent.email.split('@')[0],
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  async getSchoolReviews(schoolId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { schoolId },
      include: {
        parent: {
          select: { email: true },
        },
      },
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
        parentName: r.parent.email.split('@')[0],
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }
}

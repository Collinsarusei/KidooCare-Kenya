import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Roles(UserRole.PARENT)
  @Post()
  async createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, dto);
  }

  @Public()
  @Get('school/:schoolId')
  async getSchoolReviews(@Param('schoolId') schoolId: string) {
    return this.reviewsService.getSchoolReviews(schoolId);
  }
}

import { Controller, Post, Get, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Roles(UserRole.PARENT, UserRole.SCHOOL, UserRole.ADMIN)
  @Post('generate/:enrollmentId')
  async generateBillingCycle(@Param('enrollmentId') enrollmentId: string) {
    return this.billingService.generateBillingCycleForEnrollment(enrollmentId);
  }

  @Roles(UserRole.PARENT, UserRole.SCHOOL, UserRole.ADMIN)
  @Get('enrollment/:enrollmentId')
  async getBillingCycleForEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.billingService.getBillingCycleForEnrollment(enrollmentId);
  }

  @Roles(UserRole.ADMIN)
  @Post('monthly-rollover')
  async runMonthlyRollover() {
    return this.billingService.runMonthlyRollover();
  }
}


import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { BillingModule } from '../billing/billing.module';
import { EmailService } from '../common/email.service';
import { SmsService } from '../common/sms.service';

@Module({
  imports: [BillingModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EmailService, SmsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}

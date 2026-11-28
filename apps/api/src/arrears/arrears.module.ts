import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { EmailService } from '../common/email.service';
import { ArrearsController } from './arrears.controller';
import { ArrearsService } from './arrears.service';

@Module({
  imports: [PaymentsModule],
  controllers: [ArrearsController],
  providers: [ArrearsService, EmailService],
})
export class ArrearsModule {}

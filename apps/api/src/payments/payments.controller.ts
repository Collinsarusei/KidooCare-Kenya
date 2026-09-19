import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StkPushDto } from './dto/stk-push.dto';
import { CardTestDto } from './dto/card-test.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.PARENT)
  @Post('stk-push')
  async initiateStkPush(@Body() dto: StkPushDto, @CurrentUser('id') parentId: string) {
    return this.paymentsService.initiateStkPush(parentId, dto);
  }

  @Roles(UserRole.PARENT)
  @Post('card-test')
  async testCardPayment(@Body() dto: CardTestDto, @CurrentUser('id') parentId: string) {
    return this.paymentsService.testCardPayment(parentId, dto);
  }

  @Public()
  @Post('mpesa/callback')
  async handleMpesaCallback(@Body() body: any) {
    return this.paymentsService.handleMpesaCallback(body);
  }

  @Public()
  @Post('simulate-callback')
  async simulateCallback(@Body('checkoutRequestId') checkoutRequestId: string) {
    return this.paymentsService.simulateMpesaCallback(checkoutRequestId);
  }
}

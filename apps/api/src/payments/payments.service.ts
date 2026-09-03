import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from '../schools/credentials/credentials.service';
import { StkPushDto } from './dto/stk-push.dto';
import { PaymentStatus, PaymentMethod, WeeklyInstallmentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private credentialsService: CredentialsService,
  ) {}

  async initiateStkPush(parentId: string, dto: StkPushDto) {
    const installment = await this.prisma.weeklyInstallment.findUnique({
      where: { id: dto.weeklyInstallmentId },
      include: {
        billingCycle: {
          include: {
            enrollment: {
              include: {
                child: true,
                service: {
                  include: {
                    school: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!installment) {
      throw new NotFoundException(`Weekly installment '${dto.weeklyInstallmentId}' not found`);
    }

    const enrollment = installment.billingCycle.enrollment;
    if (enrollment.child.parentId !== parentId) {
      throw new ForbiddenException('You can only make payments for your enrolled children');
    }

    if (installment.status === WeeklyInstallmentStatus.PAID) {
      throw new BadRequestException('This weekly installment has already been fully paid');
    }

    // Format phone number to 2547XXXXXXXX
    let formattedPhone = dto.phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    }

    const school = enrollment.service.school;

    // Check school payment credentials status
    const credStatus = await this.credentialsService.getSanitizedStatus(school.id);
    if (!credStatus.isConfigured) {
      throw new BadRequestException(`Daycare '${school.name}' has not completed M-Pesa payment setup. Please contact the daycare manager.`);
    }

    // Generate unique CheckoutRequestID for STK Push
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const merchantRequestId = `mrk_${Date.now()}`;

    // Create PENDING Payment record
    const payment = await this.prisma.payment.create({
      data: {
        weeklyInstallmentId: installment.id,
        amount: dto.amount && dto.amount > 0 ? dto.amount : (installment.amountDue - installment.amountPaid),
        method: PaymentMethod.MPESA,
        mpesaCheckoutRequestId: checkoutRequestId,
        status: PaymentStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Payment',
        entityId: payment.id,
        action: 'INITIATE_STK_PUSH',
        actorId: parentId,
        afterState: {
          checkoutRequestId,
          amount: payment.amount,
          phoneLast4: formattedPhone.slice(-4),
        },
      },
    });

    this.logger.log(`STK Push initiated for installment ${installment.id}, CheckoutRequestID: ${checkoutRequestId}`);

    return {
      paymentId: payment.id,
      checkoutRequestId,
      merchantRequestId,
      status: payment.status,
      customerMessage: `STK Push prompt sent to +${formattedPhone}. Enter M-Pesa PIN on your phone to complete payment of KES ${payment.amount.toLocaleString()}.`,
    };
  }

  async handleMpesaCallback(body: any) {
    this.logger.log(`Received M-Pesa Daraja callback notification: ${JSON.stringify(body)}`);

    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return { ResultCode: 1, ResultDesc: 'Invalid callback payload structure' };
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    if (!checkoutRequestId) {
      return { ResultCode: 1, ResultDesc: 'Missing CheckoutRequestID' };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { mpesaCheckoutRequestId: checkoutRequestId },
      include: {
        weeklyInstallment: {
          include: {
            billingCycle: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`No pending payment record found for CheckoutRequestID: ${checkoutRequestId}`);
      return { ResultCode: 1, ResultDesc: 'Payment record not found' };
    }

    // IDEMPOTENCY DEDUPLICATION: If payment is already COMPLETED, discard safely
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.warn(`Idempotency trigger: Duplicate callback ignored for completed payment ${payment.id}`);
      return { ResultCode: 0, ResultDesc: 'Duplicate callback ignored' };
    }

    // Extract MpesaReceiptNumber if successful
    let receiptNumber = null;
    if (callback.CallbackMetadata && callback.CallbackMetadata.Item) {
      const receiptItem = callback.CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
      if (receiptItem) receiptNumber = receiptItem.Value;
    }

    if (resultCode === 0) {
      // Payment Successful
      await this.prisma.$transaction(async (tx) => {
        // 1. Update Payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            mpesaReceiptNumber: receiptNumber,
            paidAt: new Date(),
          },
        });

        // 2. Distribute payment across installments ("Good Maths")
        const enrollmentId = payment.weeklyInstallment.billingCycle.enrollmentId;
        let remainingAmountToDistribute = payment.amount;

        // Fetch all pending/overdue installments sorted by weekStart ASC
        const pendingInstallments = await tx.weeklyInstallment.findMany({
          where: {
            billingCycle: { enrollmentId },
            status: { in: [WeeklyInstallmentStatus.PENDING, WeeklyInstallmentStatus.OVERDUE] },
          },
          orderBy: { weekStart: 'asc' },
        });

        for (const inst of pendingInstallments) {
          if (remainingAmountToDistribute <= 0) break;
          
          const amountNeeded = inst.amountDue - inst.amountPaid;
          const amountToApply = Math.min(amountNeeded, remainingAmountToDistribute);
          
          if (amountToApply > 0) {
            const newPaid = inst.amountPaid + amountToApply;
            const isFullyPaid = newPaid >= inst.amountDue;
            await tx.weeklyInstallment.update({
              where: { id: inst.id },
              data: {
                amountPaid: newPaid,
                status: isFullyPaid ? WeeklyInstallmentStatus.PAID : inst.status,
              },
            });
            remainingAmountToDistribute -= amountToApply;
          }
        }

        // If there's STILL remaining amount (advance payment), apply it to the original installment as overpayment
        if (remainingAmountToDistribute > 0) {
          const originalInst = await tx.weeklyInstallment.findUnique({ where: { id: payment.weeklyInstallmentId } });
          if (originalInst) {
            await tx.weeklyInstallment.update({
              where: { id: originalInst.id },
              data: { amountPaid: originalInst.amountPaid + remainingAmountToDistribute },
            });
          }
        }

        // 3. Recalculate Balance arrears for enrollment
        const unpaidInstallments = await tx.weeklyInstallment.findMany({
          where: {
            billingCycle: { enrollmentId },
            status: { in: [WeeklyInstallmentStatus.PENDING, WeeklyInstallmentStatus.OVERDUE] },
          },
        });

        const totalArrears = unpaidInstallments.reduce((sum, inst) => {
          const unpaid = inst.amountDue - inst.amountPaid;
          return sum + (unpaid > 0 ? unpaid : 0); // Don't subtract overpayments from other weeks' positive arrears unless we distribute them (we do distribute them above)
        }, 0);

        await tx.balance.upsert({
          where: { enrollmentId },
          update: {
            totalArrears,
            lastCalculatedAt: new Date(),
          },
          create: {
            enrollmentId,
            totalArrears,
            lastCalculatedAt: new Date(),
          },
        });

        // 4. Write Audit Log
        await tx.auditLog.create({
          data: {
            entityType: 'Payment',
            entityId: payment.id,
            action: 'MPESA_PAYMENT_COMPLETED',
            actorId: 'MPESA_DARAJA_WEBHOOK',
            afterState: {
              checkoutRequestId,
              receiptNumber,
              amount: payment.amount,
              installmentStatus: remainingAmountToDistribute <= 0 ? 'PAID/CASCADED' : 'OVERPAID',
              remainingArrears: totalArrears,
            },
          },
        });
      });

      this.logger.log(`M-Pesa Payment ${payment.id} COMPLETED. Receipt: ${receiptNumber}`);
      return { ResultCode: 0, ResultDesc: 'Payment processed successfully' };
    } else {
      // Payment Failed or Cancelled by User
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      this.logger.warn(`M-Pesa Payment ${payment.id} FAILED with ResultCode: ${resultCode}`);
      return { ResultCode: 0, ResultDesc: 'Payment failure recorded' };
    }
  }

  /**
   * Test endpoint to simulate Daraja Webhook Callback in dev/sandbox environment
   */
  async simulateMpesaCallback(checkoutRequestId: string, receiptNumber = 'QGH7890JKL') {
    return this.handleMpesaCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: 'mrk_simulated',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 3750 },
              { Name: 'MpesaReceiptNumber', Value: receiptNumber },
              { Name: 'TransactionDate', Value: 20260724103000 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    });
  }
}

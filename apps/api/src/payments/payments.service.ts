import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from '../schools/credentials/credentials.service';
import { StkPushDto } from './dto/stk-push.dto';
import { CardTestDto } from './dto/card-test.dto';
import { PaymentStatus, PaymentMethod, WeeklyInstallmentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private credentialsService: CredentialsService,
  ) {}

  async testCardPayment(parentId: string, dto: CardTestDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Test card payments are disabled in production');
    }

    const installment = await this.prisma.weeklyInstallment.findUnique({
      where: { id: dto.weeklyInstallmentId },
      include: { billingCycle: { include: { enrollment: { include: { child: true } } } } },
    });
    if (!installment) throw new NotFoundException('Weekly installment not found');
    if (installment.billingCycle.enrollment.child.parentId !== parentId) {
      throw new ForbiddenException('You can only pay for your enrolled children');
    }
    if (installment.status === WeeklyInstallmentStatus.PAID) {
      throw new BadRequestException('This installment has already been paid');
    }

    const testCheckoutRequestId = `test-card-${Date.now()}`;
    const payment = await this.prisma.payment.create({
      data: {
        weeklyInstallmentId: installment.id,
        amount: dto.amount && dto.amount > 0 ? dto.amount : installment.amountDue - installment.amountPaid,
        method: PaymentMethod.CARD,
        mpesaCheckoutRequestId: testCheckoutRequestId,
      },
    });

    await this.handleMpesaCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: testCheckoutRequestId,
          ResultCode: 0,
          ResultDesc: 'Test card payment completed',
          CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: `TEST-CARD-${payment.id.slice(0, 8)}` }] },
        },
      },
    });

    return { paymentId: payment.id, status: PaymentStatus.COMPLETED, testMode: true };
  }

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

    // Format phone number to 2547XXXXXXXX or 2541XXXXXXXX
    let formattedPhone = dto.phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('2540')) {
      formattedPhone = '254' + formattedPhone.slice(4);
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      throw new BadRequestException(
        `Invalid Kenyan phone number format (${dto.phone}). Please enter a valid mobile number like 07XXXXXXXX or 01XXXXXXXX.`
      );
    }

    const school = enrollment.service.school;

    // Check school payment credentials status
    const credStatus = await this.credentialsService.getSanitizedStatus(school.id);
    if (!credStatus.isConfigured) {
      throw new BadRequestException(`Daycare '${school.name}' has not completed M-Pesa payment setup. Please contact the daycare manager.`);
    }

    const mpesaCreds = await this.credentialsService.getDecryptedCredentialsInternal(school.id);
    const authBuf = Buffer.from(`${mpesaCreds.consumerKey}:${mpesaCreds.consumerSecret}`).toString('base64');
    let mpesaToken = '';
    
    try {
      const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${authBuf}` }
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        this.logger.error(`Failed to get M-Pesa token: ${JSON.stringify(tokenData)}`);
        throw new Error('M-Pesa auth failed');
      }
      mpesaToken = tokenData.access_token;
    } catch (err: any) {
      this.logger.error(`M-Pesa OAuth error: ${err.message}`);
      throw new BadRequestException('Could not connect to payment gateway. Please try again later.');
    }

    const shortcode = mpesaCreds.shortcode;
    const passkey = mpesaCreds.passkey;

    // Format East Africa Time (EAT, UTC+3) timestamp YYYYMMDDHHmmss required by Daraja
    const eatFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = eatFormatter.formatToParts(new Date());
    const getP = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const timestamp = `${getP('year')}${getP('month')}${getP('day')}${getP('hour')}${getP('minute')}${getP('second')}`;

    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');
    const paymentAmount = Math.max(1, Math.round(dto.amount && dto.amount > 0 ? dto.amount : (installment.amountDue - installment.amountPaid)));
    const callbackUrl = await this.getActiveCallbackUrl();

    // Daraja Lipa Na M-Pesa strict constraints:
    // - AccountReference: Max 12 alphanumeric characters, NO spaces/symbols
    // - TransactionDesc: Max 13 alphanumeric characters, NO spaces/symbols
    const accountRef = `KC${installment.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`;
    const transactionDesc = 'DaycareFee';

    let checkoutRequestId = '';
    let merchantRequestId = '';

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: paymentAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: transactionDesc,
    };

    this.logger.log(`Dispatching Daraja STK Push to ${formattedPhone} for KES ${paymentAmount} (Callback: ${callbackUrl})`);

    try {
      const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpesaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const stkData = await stkRes.json();
      
      if (!stkRes.ok || stkData.ResponseCode !== '0') {
        this.logger.error(`STK Push failed from Safaricom: ${JSON.stringify(stkData)}`);
        const msg = stkData.errorMessage || stkData.ResultDesc || stkData.ResponseDescription || 'STK Push failed';
        throw new Error(msg);
      }

      checkoutRequestId = stkData.CheckoutRequestID;
      merchantRequestId = stkData.MerchantRequestID;
    } catch (err: any) {
      this.logger.error(`M-Pesa STK Push error: ${err.message}`);
      throw new BadRequestException(`M-Pesa error: ${err.message}`);
    }

    // Create PENDING Payment record
    const payment = await this.prisma.payment.create({
      data: {
        weeklyInstallmentId: installment.id,
        amount: paymentAmount,
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

        // 3.5. Activate PENDING_PAYMENT enrollment and link child to school
        const enrollment = await tx.enrollment.findUnique({ 
          where: { id: enrollmentId },
          include: { service: true }
        });
        if (enrollment) {
          if (enrollment.status === 'PENDING_PAYMENT') {
            await tx.enrollment.update({
              where: { id: enrollmentId },
              data: { status: 'ACTIVE' },
            });
            
            // Increment capacity
            await tx.service.update({
              where: { id: enrollment.serviceId },
              data: { currentEnrollmentCount: { increment: 1 } },
            });
          }

          // Always ensure child is assigned to school
          await tx.child.update({
            where: { id: enrollment.childId },
            data: { schoolId: enrollment.service.schoolId },
          });

          await tx.auditLog.create({
            data: {
              entityType: 'Enrollment',
              entityId: enrollmentId,
              action: 'PAYMENT_ACTIVATED_ENROLLMENT',
              actorId: 'MPESA_DARAJA_WEBHOOK',
              afterState: { status: 'ACTIVE', schoolId: enrollment.service.schoolId },
            },
          });
        }

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

  async getParentPayments(parentId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        weeklyInstallment: {
          billingCycle: {
            enrollment: {
              child: { parentId },
            },
          },
        },
      },
      include: {
        weeklyInstallment: {
          include: {
            billingCycle: {
              include: {
                enrollment: {
                  include: {
                    child: true,
                    service: {
                      include: {
                        school: {
                          select: { id: true, name: true, location: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        disputes: {
          select: {
            id: true,
            reason: true,
            status: true,
            resolutionNote: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return (payments as any[]).map((p) => {
      const inst = p.weeklyInstallment;
      const cycle = inst?.billingCycle;
      const enr = cycle?.enrollment;
      const child = enr?.child;
      const service = enr?.service;
      const school = service?.school;
      const latestDispute = p.disputes?.[0] || null;

      return {
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        mpesaReceiptNumber: p.mpesaReceiptNumber,
        mpesaCheckoutRequestId: p.mpesaCheckoutRequestId,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        weeklyInstallmentId: inst?.id,
        weekNumber: inst?.weekNumber,
        childName: child?.name || 'Child',
        childId: child?.id,
        schoolName: school?.name || 'School',
        schoolId: school?.id,
        serviceName: service?.name || 'Service',
        dispute: latestDispute,
      };
    });
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amount: true,
        mpesaReceiptNumber: true,
        mpesaCheckoutRequestId: true,
        paidAt: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment record '${paymentId}' not found`);
    }
    return payment;
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

  /**
   * Resolves the active public callback URL for M-Pesa callbacks.
   * If ngrok is running locally on port 4040, dynamically fetches the active tunnel URL.
   * Otherwise falls back to APP_URL from environment variables.
   */
  private async getActiveCallbackUrl(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);
      const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: any = await res.json();
        const httpsTunnel = data.tunnels?.find((t: any) => t.public_url?.startsWith('https://'));
        if (httpsTunnel?.public_url) {
          const url = `${httpsTunnel.public_url}/api/payments/mpesa/callback`;
          this.logger.log(`Auto-detected active ngrok callback URL: ${url}`);
          return url;
        }
      }
    } catch {
      // ngrok not running locally on 4040, fall back to APP_URL
    }

    const appUrl = (process.env.APP_URL || 'https://sandbox.kidoocare.com').trim().replace(/\/$/, '');
    return `${appUrl}/api/payments/mpesa/callback`;
  }
}


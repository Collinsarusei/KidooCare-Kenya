import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  async createDispute(parentId: string, dto: CreateDisputeDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: {
        weeklyInstallment: {
          include: {
            billingCycle: {
              include: {
                enrollment: {
                  include: { child: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${dto.paymentId}' not found`);
    }

    if (payment.weeklyInstallment.billingCycle.enrollment.child.parentId !== parentId) {
      throw new ForbiddenException('You can only raise disputes for your own child payments');
    }

    const existingDispute = await this.prisma.dispute.findFirst({
      where: { paymentId: dto.paymentId, status: 'OPEN' },
    });
    if (existingDispute) {
      throw new BadRequestException('An open dispute already exists for this payment');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        paymentId: dto.paymentId,
        raisedByParentId: parentId,
        reason: dto.reason,
      },
      include: {
        payment: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Dispute',
        entityId: dispute.id,
        action: 'RAISE_DISPUTE',
        actorId: parentId,
        afterState: { paymentId: dto.paymentId, reason: dto.reason, status: dispute.status },
      },
    });

    return dispute;
  }

  async getParentDisputes(parentId: string) {
    return this.prisma.dispute.findMany({
      where: { raisedByParentId: parentId },
      include: {
        payment: {
          include: {
            weeklyInstallment: {
              include: {
                billingCycle: {
                  include: {
                    enrollment: {
                      include: {
                        child: true,
                        service: { include: { school: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminDisputes() {
    return this.prisma.dispute.findMany({
      include: {
        raisedByParent: {
          select: { email: true, phone: true },
        },
        payment: {
          include: {
            weeklyInstallment: {
              include: {
                billingCycle: {
                  include: {
                    enrollment: {
                      include: {
                        child: true,
                        service: { include: { school: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSchoolDisputes(userId: string) {
    const school = await this.prisma.school.findUnique({
      where: { userId },
    });
    if (!school) {
      return [];
    }

    return this.prisma.dispute.findMany({
      where: {
        payment: {
          weeklyInstallment: {
            billingCycle: {
              enrollment: {
                service: {
                  schoolId: school.id,
                },
              },
            },
          },
        },
      },
      include: {
        raisedByParent: {
          select: { email: true, phone: true },
        },
        payment: {
          include: {
            weeklyInstallment: {
              include: {
                billingCycle: {
                  include: {
                    enrollment: {
                      include: {
                        child: true,
                        service: { include: { school: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID '${disputeId}' not found`);
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        resolvedByAdminId: adminId,
        resolutionNote: dto.resolutionNote,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Dispute',
        entityId: disputeId,
        action: `RESOLVE_DISPUTE_${dto.status}`,
        actorId: adminId,
        beforeState: { status: dispute.status },
        afterState: { status: updated.status, resolutionNote: dto.resolutionNote },
      },
    });

    return updated;
  }
}

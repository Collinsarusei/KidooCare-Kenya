import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole, ServiceBillingCycle } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async createService(schoolId: string, dto: CreateServiceDto, actorId: string, actorRole: UserRole) {
    await this.verifySchoolOwnership(schoolId, actorId, actorRole);

    const service = await this.prisma.service.create({
      data: {
        schoolId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        capacity: dto.capacity,
        billingCycle: ServiceBillingCycle.MONTHLY,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Service',
        entityId: service.id,
        action: 'CREATE_SERVICE',
        actorId,
        afterState: { name: service.name, price: service.price, capacity: service.capacity },
      },
    });

    return service;
  }

  async getServicesBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    return this.prisma.service.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceById(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { school: true },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID '${serviceId}' not found`);
    }
    return service;
  }

  async updateService(serviceId: string, dto: UpdateServiceDto, actorId: string, actorRole: UserRole) {
    const service = await this.getServiceById(serviceId);
    await this.verifySchoolOwnership(service.schoolId, actorId, actorRole);

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Service',
        entityId: serviceId,
        action: 'UPDATE_SERVICE',
        actorId,
        beforeState: { name: service.name, price: service.price, capacity: service.capacity },
        afterState: { name: updated.name, price: updated.price, capacity: updated.capacity },
      },
    });

    return updated;
  }

  async deleteService(serviceId: string, actorId: string, actorRole: UserRole) {
    const service = await this.getServiceById(serviceId);
    await this.verifySchoolOwnership(service.schoolId, actorId, actorRole);

    await this.prisma.service.delete({
      where: { id: serviceId },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Service',
        entityId: serviceId,
        action: 'DELETE_SERVICE',
        actorId,
        beforeState: { name: service.name, price: service.price },
      },
    });

    return { message: 'Service deleted successfully' };
  }

  private async verifySchoolOwnership(schoolId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN) return;

    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }
    if (school.userId !== userId) {
      throw new ForbiddenException('You can only manage services for your own school');
    }
  }
}

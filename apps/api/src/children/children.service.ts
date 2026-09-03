import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) {}

  async createChild(parentId: string, dto: CreateChildDto) {
    const child = await this.prisma.child.create({
      data: {
        parentId,
        name: dto.name,
        dob: new Date(dto.dob),
        notes: dto.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Child',
        entityId: child.id,
        action: 'CREATE_CHILD_INTAKE',
        actorId: parentId,
        afterState: { name: child.name, dob: child.dob },
      },
    });

    return child;
  }

  async getChildrenByParent(parentId: string) {
    return this.prisma.child.findMany({
      where: { parentId },
      include: {
        school: {
          select: { name: true, location: true },
        },
        enrollments: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChildById(childId: string, parentId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });
    if (!child || child.parentId !== parentId) {
      throw new NotFoundException(`Child with ID '${childId}' not found or access denied`);
    }
    return child;
  }

  async updateChild(childId: string, parentId: string, dto: CreateChildDto) {
    await this.getChildById(childId, parentId); // verify access

    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: {
        name: dto.name,
        dob: new Date(dto.dob),
        notes: dto.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Child',
        entityId: updated.id,
        action: 'UPDATE_CHILD',
        actorId: parentId,
        afterState: { name: updated.name, dob: updated.dob },
      },
    });

    return updated;
  }

  async deleteChild(childId: string, parentId: string) {
    await this.getChildById(childId, parentId); // verify access

    await this.prisma.auditLog.create({
      data: {
        entityType: 'Child',
        entityId: childId,
        action: 'DELETE_CHILD',
        actorId: parentId,
      },
    });

    return this.prisma.child.delete({
      where: { id: childId },
    });
  }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from './credentials/credentials.service';
import { EmailService } from '../common/email.service';
import { OnboardSchoolDto } from './dto/onboard-school.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { UserRole, SchoolStatus } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private credentialsService: CredentialsService,
    private emailService: EmailService,
  ) {}

  async onboardSchool(dto: OnboardSchoolDto, adminId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('User with this admin email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.adminPassword, saltRounds);

    const hasFullCreds =
      dto.mpesaConsumerKey &&
      dto.mpesaConsumerSecret &&
      dto.mpesaShortcode &&
      dto.mpesaPasskey;

    const initialStatus = hasFullCreds ? SchoolStatus.ACTIVE : SchoolStatus.PENDING_PROFILE;

    const school = await this.prisma.$transaction(async (tx) => {
      const schoolUser = await tx.user.create({
        data: {
          email: dto.adminEmail.toLowerCase().trim(),
          phone: dto.adminPhone,
          role: UserRole.SCHOOL,
          passwordHash,
          mustChangePassword: true,
        },
      });

      const newSchool = await tx.school.create({
        data: {
          userId: schoolUser.id,
          name: dto.schoolName,
          about: dto.about,
          location: dto.location,
          status: initialStatus,
          createdByAdminId: adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'School',
          entityId: newSchool.id,
          action: 'ONBOARD_SCHOOL',
          actorId: adminId,
          afterState: {
            schoolName: newSchool.name,
            adminEmail: schoolUser.email,
            hasCredentials: Boolean(hasFullCreds),
          },
        },
      });

      return newSchool;
    });

    if (hasFullCreds) {
      await this.credentialsService.saveOrUpdateCredentials(
        school.id,
        {
          mpesaConsumerKey: dto.mpesaConsumerKey!,
          mpesaConsumerSecret: dto.mpesaConsumerSecret!,
          mpesaShortcode: dto.mpesaShortcode!,
          mpesaPasskey: dto.mpesaPasskey!,
        },
        UserRole.ADMIN,
      );
    }

    // Send onboarding credentials email via Resend
    const emailResult = await this.emailService.sendSchoolCredentialsEmail(
      dto.schoolName,
      dto.adminEmail.toLowerCase().trim(),
      dto.adminPassword,
    );

    const schoolData = await this.getSchoolById(school.id);
    return {
      ...schoolData,
      emailSent: emailResult.sent,
      emailMessage: emailResult.message,
    };
  }

  async getAdminSchoolsList() {
    const schools = await this.prisma.school.findMany({
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        credentials: true,
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      schools.map(async (school) => {
        const credStatus = await this.credentialsService.getSanitizedStatus(school.id);
        const { credentials: _, ...rest } = school;
        return {
          ...rest,
          credentialsStatus: credStatus,
        };
      }),
    );
  }

  async getSchoolById(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID '${id}' not found`);
    }

    const credStatus = await this.credentialsService.getSanitizedStatus(school.id);

    return {
      ...school,
      credentialsStatus: credStatus,
    };
  }

  async updateCredentials(schoolId: string, dto: UpdateCredentialsDto, actorId: string, actorRole: UserRole) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    const sanitized = await this.credentialsService.saveOrUpdateCredentials(
      schoolId,
      dto,
      actorRole,
    );

    // If school status was PENDING_PROFILE, update to ACTIVE
    if (school.status === SchoolStatus.PENDING_PROFILE) {
      await this.prisma.school.update({
        where: { id: schoolId },
        data: { status: SchoolStatus.ACTIVE },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        entityType: 'SchoolPaymentCredentials',
        entityId: schoolId,
        action: 'UPDATE_CREDENTIALS',
        actorId,
        afterState: {
          shortcodeLast4: sanitized.shortcodeLast4,
          providedBy: actorRole,
        },
      },
    });

    return this.getSchoolById(schoolId);
  }

  async updateSchoolProfile(
    schoolId: string,
    dto: {
      name?: string;
      about?: string;
      location?: string;
      logoUrl?: string;
      coverImages?: string[];
      capacity?: number;
      ageRange?: string;
      keyHighlights?: string[];
      status?: SchoolStatus;
    },
    actorId: string,
  ) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.about !== undefined && { about: dto.about }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.coverImages && { coverImages: dto.coverImages }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.ageRange !== undefined && { ageRange: dto.ageRange }),
        ...(dto.keyHighlights && { keyHighlights: dto.keyHighlights }),
        ...(dto.status && { status: dto.status }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'School',
        entityId: schoolId,
        action: 'UPDATE_SCHOOL_PROFILE',
        actorId,
        beforeState: { name: school.name, location: school.location },
        afterState: { name: updated.name, location: updated.location },
      },
    });

    return this.getSchoolById(schoolId);
  }

  async getPublicSchoolsList(search?: string, location?: string) {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { about: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    const schools = await this.prisma.school.findMany({
      where: whereClause,
      include: {
        services: true,
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      schools.map(async (school) => {
        const credStatus = await this.credentialsService.getSanitizedStatus(school.id);
        const prices = school.services.map((s) => s.price);
        const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

        return {
          id: school.id,
          name: school.name,
          about: school.about,
          logoUrl: school.logoUrl,
          location: school.location,
          verifiedBadge: school.verifiedBadge,
          servicesCount: school.services.length,
          startingPrice,
          credentialsStatus: credStatus,
          services: school.services,
        };
      }),
    );
  }

  async getPublicSchoolDetail(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID '${id}' not found`);
    }

    const credStatus = await this.credentialsService.getSanitizedStatus(school.id);
    const prices = school.services.map((s) => s.price);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

    return {
      id: school.id,
      name: school.name,
      about: school.about,
      logoUrl: school.logoUrl,
      coverImages: school.coverImages,
      location: school.location,
      status: school.status,
      verifiedBadge: school.verifiedBadge,
      servicesCount: school.services.length,
      startingPrice,
      credentialsStatus: credStatus,
      services: school.services,
    };
  }

  async deleteSchool(schoolId: string, adminId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { user: true },
    });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    // Deleting the User cascades to School (and all School child records via onDelete: Cascade)
    await this.prisma.user.delete({ where: { id: school.userId } });

    // Log the deletion (AuditLog has no FK to School so this is safe after deletion)
    await this.prisma.auditLog.create({
      data: {
        entityType: 'School',
        entityId: schoolId,
        action: 'DELETE_SCHOOL',
        actorId: adminId,
        beforeState: { schoolName: school.name, adminEmail: school.user?.email },
        afterState: { deleted: true },
      },
    });

    return { deleted: true, schoolId, schoolName: school.name };
  }

  async toggleSchoolStatus(schoolId: string, adminId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    const newStatus =
      school.status === SchoolStatus.SUSPENDED
        ? SchoolStatus.ACTIVE
        : SchoolStatus.SUSPENDED;

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: { status: newStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'School',
        entityId: schoolId,
        action: newStatus === SchoolStatus.SUSPENDED ? 'DEACTIVATE_SCHOOL' : 'REACTIVATE_SCHOOL',
        actorId: adminId,
        beforeState: { status: school.status },
        afterState: { status: newStatus },
      },
    });

    return this.getSchoolById(updated.id);
  }

  async addTutor(schoolId: string, dto: { name: string; email: string; phone: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const tempPassword = Math.random().toString(36).slice(-8) + 'T!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    const tutor = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        role: UserRole.TUTOR,
        passwordHash,
        mustChangePassword: true,
        employedAtSchoolId: schoolId,
      },
    });

    await this.emailService.sendTutorCredentialsEmail(
      school.name,
      tutor.email,
      tempPassword,
    );

    return tutor;
  }

  async updateTutor(schoolId: string, tutorId: string, dto: { email?: string; phone?: string }) {
    const tutor = await this.prisma.user.findUnique({
      where: { id: tutorId },
    });
    if (!tutor || tutor.employedAtSchoolId !== schoolId) {
      throw new NotFoundException('Tutor not found');
    }

    const dataToUpdate: any = {};
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing && existing.id !== tutorId) {
        throw new ConflictException('Email is already in use by another account');
      }
      dataToUpdate.email = dto.email.toLowerCase().trim();
    }
    if (dto.phone) {
      dataToUpdate.phone = dto.phone;
    }

    return this.prisma.user.update({
      where: { id: tutorId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        phone: true,
        createdAt: true,
      }
    });
  }

  async resendTutorInvite(schoolId: string, tutorId: string) {
    const tutor = await this.prisma.user.findUnique({
      where: { id: tutorId },
    });
    if (!tutor || tutor.employedAtSchoolId !== schoolId) {
      throw new NotFoundException('Tutor not found');
    }

    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    
    const tempPassword = Math.random().toString(36).slice(-8) + 'T!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: tutorId },
      data: {
        passwordHash,
        mustChangePassword: true,
      }
    });

    await this.emailService.sendTutorCredentialsEmail(
      school!.name,
      tutor.email,
      tempPassword,
    );

    return { message: 'Invite resent successfully' };
  }

  async getTutorsBySchoolId(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        employedAtSchoolId: schoolId,
        role: UserRole.TUTOR,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        createdAt: true,
      }
    });
  }
}

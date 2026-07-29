import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SchoolDocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(schoolId: string, actorId: string, actorRole: UserRole, dto: UploadDocumentDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException(`School with ID '${schoolId}' not found`);
    }

    if (actorRole === UserRole.SCHOOL && school.userId !== actorId) {
      throw new ForbiddenException('You can only upload documents for your own school');
    }

    const doc = await this.prisma.schoolDocument.create({
      data: {
        schoolId,
        type: dto.type,
        fileUrl: dto.fileUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'SchoolDocument',
        entityId: doc.id,
        action: 'UPLOAD_DOCUMENT',
        actorId,
        afterState: { type: doc.type, fileUrl: doc.fileUrl, schoolId },
      },
    });

    return doc;
  }

  async getSchoolDocuments(schoolId: string) {
    return this.prisma.schoolDocument.findMany({
      where: { schoolId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getAllDocuments() {
    return this.prisma.schoolDocument.findMany({
      include: {
        school: {
          select: { name: true, location: true, verifiedBadge: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async verifyDocument(documentId: string, adminId: string, verified: boolean) {
    const doc = await this.prisma.schoolDocument.findUnique({
      where: { id: documentId },
      include: { school: true },
    });

    if (!doc) {
      throw new NotFoundException(`Document with ID '${documentId}' not found`);
    }

    const updatedDoc = await this.prisma.schoolDocument.update({
      where: { id: documentId },
      data: {
        verifiedByAdminId: verified ? adminId : null,
        verifiedAt: verified ? new Date() : null,
      },
    });

    // Recalculate School verifiedBadge status
    const verifiedDocsCount = await this.prisma.schoolDocument.count({
      where: {
        schoolId: doc.schoolId,
        verifiedAt: { not: null },
      },
    });

    const hasBadge = verifiedDocsCount > 0;
    await this.prisma.school.update({
      where: { id: doc.schoolId },
      data: { verifiedBadge: hasBadge },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'SchoolDocument',
        entityId: documentId,
        action: verified ? 'VERIFY_DOCUMENT' : 'UNVERIFY_DOCUMENT',
        actorId: adminId,
        beforeState: { verifiedAt: doc.verifiedAt },
        afterState: { verifiedAt: updatedDoc.verifiedAt, schoolVerifiedBadge: hasBadge },
      },
    });

    return {
      ...updatedDoc,
      schoolVerifiedBadge: hasBadge,
    };
  }
}

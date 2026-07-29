import { Controller, Post, Get, Patch, Body, Param, Req } from '@nestjs/common';
import { SchoolDocumentsService } from './school-documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class SchoolDocumentsController {
  constructor(private readonly documentsService: SchoolDocumentsService) {}

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Post('schools/:schoolId/documents')
  async uploadDocument(
    @Param('schoolId') schoolId: string,
    @Req() req: any,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(schoolId, req.user.id, req.user.role, dto);
  }

  @Roles(UserRole.SCHOOL, UserRole.ADMIN)
  @Get('schools/:schoolId/documents')
  async getSchoolDocuments(@Param('schoolId') schoolId: string) {
    return this.documentsService.getSchoolDocuments(schoolId);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/documents')
  async getAllDocuments() {
    return this.documentsService.getAllDocuments();
  }

  @Roles(UserRole.ADMIN)
  @Patch('school-documents/:id/verify')
  async verifyDocument(
    @Param('id') documentId: string,
    @Req() req: any,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.documentsService.verifyDocument(documentId, req.user.id, dto.verified);
  }
}

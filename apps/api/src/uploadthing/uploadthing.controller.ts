import { Controller, Post, Body } from '@nestjs/common';
import { UploadthingService } from './uploadthing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('uploadthing')
export class UploadthingController {
  constructor(private readonly uploadthingService: UploadthingService) {}

  @Roles(UserRole.SCHOOL, UserRole.ADMIN, UserRole.PARENT, UserRole.TUTOR)
  @Post('upload')
  async uploadFile(
    @Body('fileName') fileName: string,
    @Body('fileData') fileData: string,
    @Body('fileType') fileType: string,
  ) {
    return this.uploadthingService.uploadFile(fileName || `document_${Date.now()}.pdf`, fileData, fileType);
  }
}

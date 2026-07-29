import { Controller, Post, Body } from '@nestjs/common';
import { UploadthingService } from './uploadthing.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('uploadthing')
export class UploadthingController {
  constructor(private readonly uploadthingService: UploadthingService) {}

  @Public()
  @Post('upload')
  async uploadFile(
    @Body('fileName') fileName: string,
    @Body('fileData') fileData: string,
    @Body('fileType') fileType: string,
  ) {
    const name = fileName || `document_${Date.now()}.pdf`;
    const data = fileData || '';
    const type = fileType || 'application/pdf';
    return this.uploadthingService.uploadFile(name, data, type);
  }
}

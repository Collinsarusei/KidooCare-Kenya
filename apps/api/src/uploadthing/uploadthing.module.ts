import { Module } from '@nestjs/common';
import { UploadthingController } from './uploadthing.controller';
import { UploadthingService } from './uploadthing.service';

@Module({
  controllers: [UploadthingController],
  providers: [UploadthingService],
  exports: [UploadthingService],
})
export class UploadthingModule {}

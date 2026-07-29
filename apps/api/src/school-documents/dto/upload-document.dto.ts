import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { SchoolDocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsEnum(SchoolDocumentType)
  type: SchoolDocumentType;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

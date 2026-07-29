import { IsBoolean } from 'class-validator';

export class VerifyDocumentDto {
  @IsBoolean()
  verified: boolean;
}

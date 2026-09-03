import { IsNotEmpty, IsString, Matches, IsOptional, IsNumber } from 'class-validator';

export class StkPushDto {
  @IsString()
  @IsNotEmpty()
  weeklyInstallmentId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:254|\+254|0)?(7|1)\d{8}$/, {
    message: 'Phone number must be a valid Kenyan mobile number (e.g. 254712345678 or 0712345678)',
  })
  phone: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

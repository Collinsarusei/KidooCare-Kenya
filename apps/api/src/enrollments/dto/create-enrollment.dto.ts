import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  childId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

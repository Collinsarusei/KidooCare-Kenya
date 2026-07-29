import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

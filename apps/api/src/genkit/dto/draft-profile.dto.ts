import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt, Min, MaxLength } from 'class-validator';

export class DraftProfileDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  highlights?: string[];

  /** Free-text description written by the school owner */
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  details?: string;

  @IsString()
  @IsOptional()
  ageRange?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}

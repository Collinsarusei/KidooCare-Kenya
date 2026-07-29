import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

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
}

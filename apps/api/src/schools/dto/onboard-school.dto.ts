import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class OnboardSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminPhone: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  mpesaConsumerKey?: string;

  @IsOptional()
  @IsString()
  mpesaConsumerSecret?: string;

  @IsOptional()
  @IsString()
  mpesaShortcode?: string;

  @IsOptional()
  @IsString()
  mpesaPasskey?: string;
}

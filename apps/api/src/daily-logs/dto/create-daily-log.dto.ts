import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChildHealthStatus, DailyLogMood } from '@prisma/client';

export class CreateDailyLogDto {
  @IsBoolean()
  isPresent: boolean;

  /** Required when the child is present; ignored when the child is absent. */
  @IsOptional()
  @IsEnum(DailyLogMood)
  mood?: DailyLogMood;

  @IsOptional() @IsArray() @IsString({ each: true })
  achievements?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  milestones?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  allergiesSpotted?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  assignments?: string;

  @IsOptional() @IsString() @MaxLength(200)
  assessmentType?: string;

  @IsOptional() @IsString() @MaxLength(500)
  assessmentResult?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  behavior?: string;

  @IsOptional() @IsEnum(ChildHealthStatus)
  healthStatus?: ChildHealthStatus;

  @IsOptional() @IsString() @MaxLength(1000)
  healthNotes?: string;

  /** Tutor asks the parent to come and collect the child. */
  @IsOptional() @IsBoolean()
  requiresPickup?: boolean;

  @IsOptional() @IsString() @MaxLength(200)
  hospitalName?: string;

  @IsOptional() @IsString() @MaxLength(500)
  hospitalNotes?: string;

  /** Bulk attendance: only change present/absent, keep anything already logged today. */
  @IsOptional() @IsBoolean()
  attendanceOnly?: boolean;
}

import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const CONTACT_TOPICS = ['PARENT', 'DAYCARE', 'PAYMENTS', 'TECHNICAL', 'PARTNERSHIP', 'OTHER'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export class ContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s()-]{0,20}$/, { message: 'Phone number can only contain digits, spaces and +' })
  phone?: string;

  @IsIn(CONTACT_TOPICS as unknown as string[])
  topic: ContactTopic;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(10, { message: 'Please write a little more (at least 10 characters)' })
  @MaxLength(3000)
  message: string;

  /** Honeypot — real users never fill this hidden field. */
  @IsOptional()
  @IsString()
  website?: string;
}

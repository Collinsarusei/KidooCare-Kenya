import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

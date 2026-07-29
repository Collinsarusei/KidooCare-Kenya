import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCredentialsDto {
  @IsString()
  @IsNotEmpty()
  mpesaConsumerKey: string;

  @IsString()
  @IsNotEmpty()
  mpesaConsumerSecret: string;

  @IsString()
  @IsNotEmpty()
  mpesaShortcode: string;

  @IsString()
  @IsNotEmpty()
  mpesaPasskey: string;
}

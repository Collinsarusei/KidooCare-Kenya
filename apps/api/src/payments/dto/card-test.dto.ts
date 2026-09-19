import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class CardTestDto {
  @IsString()
  @IsNotEmpty()
  weeklyInstallmentId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @Matches(/^\d{13,19}$/, {
    message: 'Card number must contain 13 to 19 digits',
  })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry must use MM/YY format',
  })
  expiry: string;

  @IsString()
  @Matches(/^\d{3,4}$/, {
    message: 'CVV must contain 3 or 4 digits',
  })
  cvv: string;
}

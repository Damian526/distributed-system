import { IsString, IsNotEmpty, IsNumber, IsPositive, Max, MaxLength, IsIn } from 'class-validator';

export const ALLOWED_CHECKOUT_CURRENCIES = ['usd', 'eur', 'pln'] as const;

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  productName!: string;

  @IsNumber()
  @IsPositive()
  @Max(100000)
  amount!: number; // e.g. 49.99, not cents

  @IsString()
  @IsIn(ALLOWED_CHECKOUT_CURRENCIES)
  currency!: string; // lowercase, e.g. "usd"
}

import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsPositive()
  amount!: number; // in whole currency units, e.g. 49.99

  @IsString()
  @IsNotEmpty()
  currency!: string; // "usd", "eur", "pln"
}

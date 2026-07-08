import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsPositive()
  amount!: number; // e.g. 49.99, not cents

  @IsString()
  @IsNotEmpty()
  currency!: string; // lowercase, e.g. "usd"
}

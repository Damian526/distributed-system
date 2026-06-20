import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  currency: string;
}

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEmail,
} from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  currency!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  @IsNotEmpty()
  customerFirstName!: string;

  @IsString()
  @IsNotEmpty()
  customerLastName!: string;

  @IsString()
  @IsNotEmpty()
  customerCity!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;
}

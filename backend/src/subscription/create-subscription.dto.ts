import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  merchant_name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsIn(['weekly', 'monthly', 'quarterly', 'yearly'])
  billing_cycle: string;
}

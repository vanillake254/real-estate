import { IsNumber, IsString, Min } from 'class-validator';

export class CreateDepositDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  message: string;

  @IsString()
  phoneNumber: string;
}


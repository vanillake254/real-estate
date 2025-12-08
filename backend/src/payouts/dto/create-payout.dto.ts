import { IsIn, IsNumber, IsString, Min } from 'class-validator';

export class CreatePayoutDto {
  @IsNumber()
  @Min(100)
  @IsIn([100, 150, 200, 250, 300, 350])
  amount: number;

  @IsString()
  phoneNumber: string;
}


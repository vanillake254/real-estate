import { IsNumber, IsString, Min, IsDivisibleBy } from 'class-validator';

export class CreatePayoutDto {
  @IsNumber()
  @Min(100)
  @IsDivisibleBy(100)
  amount: number;

  @IsString()
  phoneNumber: string;
}

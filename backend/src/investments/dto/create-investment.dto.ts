import { IsString } from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  packageId: string;
}


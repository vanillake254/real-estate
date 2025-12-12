import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class PackageDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  price: number;

  @IsNumber()
  @Min(1)
  dailyReturn: number;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

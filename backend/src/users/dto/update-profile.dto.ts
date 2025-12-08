import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ValidateIf((o) => o.currentPassword)
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword?: string;
}

import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // Can be username or email

  @IsString()
  @MinLength(6)
  password: string;
}

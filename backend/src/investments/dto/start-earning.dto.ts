import { IsString } from 'class-validator';

export class StartEarningDto {
  @IsString()
  earningId: string;
}

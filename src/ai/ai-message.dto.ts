import { IsString, IsOptional } from 'class-validator';

export class UserMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

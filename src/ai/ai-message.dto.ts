import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  userId?: string; // optional, useful later for per-user memory
}

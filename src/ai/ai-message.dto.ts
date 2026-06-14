// src/ai/ai-message.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UserMessageDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  clientName?: string;
}
// src/gallery/dto/signed-url.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum SignedUrlOperation { GET = 'GET', PUT = 'PUT' }

export class GenerateSignedUrlDto {
  @IsString() key!: string;
  @IsOptional() @IsEnum(SignedUrlOperation) operation?: SignedUrlOperation;
  @IsOptional() @IsNumber() expiresIn?: number;
}

export class SignedUrlResponseDto {
  signedUrl!: string;
  expiresAt!: Date;
  key!: string;
  operation!: SignedUrlOperation;
}
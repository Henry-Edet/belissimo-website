// src/gallery/dto/signed-url.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum SignedUrlOperation {
  GET = 'getObject',
  PUT = 'putObject',
}

export class GenerateSignedUrlDto {
  @ApiProperty({ description: 'S3 key of the file' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ 
    description: 'Operation type', 
    enum: SignedUrlOperation, 
    default: SignedUrlOperation.GET,
    enumName: 'SignedUrlOperation'
  })
  @IsOptional()
  @IsEnum(SignedUrlOperation)
  operation?: SignedUrlOperation;

  @ApiPropertyOptional({ 
    description: 'Expiration time in seconds', 
    default: 3600 
  })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}

export class SignedUrlResponseDto {
  @ApiProperty({ description: 'Signed URL for temporary access' })
  signedUrl: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'S3 key' })
  key: string;

  @ApiProperty({ description: 'Operation type', enum: SignedUrlOperation , enumName: 'SignedUrlOperation'})
  operation: SignedUrlOperation;
}
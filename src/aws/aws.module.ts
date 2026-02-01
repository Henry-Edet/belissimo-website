// src/aws/aws.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [ConfigModule, S3Module],
  exports: [S3Module],
})
export class AwsModule {}
// src/aws/aws.module.ts
import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';

@Module({
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {}
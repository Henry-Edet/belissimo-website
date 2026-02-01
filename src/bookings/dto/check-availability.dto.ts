// src/bookings/dto/check-availability.dto.ts
import { IsString, IsDateString, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckAvailabilityDto {
  @IsString()
  serviceId: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  durationMinutes?: number;
}
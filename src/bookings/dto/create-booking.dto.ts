// src/bookings/dto/create-booking.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsString()
  clientName: string;

  @IsNotEmpty()
  @IsString()
  clientPhone: string; // Remove phone validation or make it optional

  @IsNotEmpty()
  @Transform(({ value }) => {
    // Try to parse date
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date;
  })
  startAt: Date | string;

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endAt?: Date;

  @IsOptional()
  @IsString()
  subServiceName?: string;
}
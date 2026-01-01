import { IsString, IsUUID, IsDateString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Booking } from '../booking.entity';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  subServiceName: string;

  @IsString()
  clientName: string;

  @IsString()
  clientPhone: string;

  @IsDateString()
  startAt: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @IsOptional()
  priceCents?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  @IsOptional()
  status?: Booking['status'];
}

import { IsNotEmpty, IsUUID, IsString, IsISO8601 } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsISO8601()
  @IsNotEmpty()
  startAt: string;
}

import { IsString, IsUUID, IsDateString } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  subServiceName: string;

  @IsDateString()
  startAt: string;
}

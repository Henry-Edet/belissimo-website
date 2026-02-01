// src/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './booking.entity';
import { Service } from '../services/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Service])],
  providers: [BookingService],
  controllers: [BookingsController],
  exports: [BookingService],
})
export class BookingsModule {}
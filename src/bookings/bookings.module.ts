import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from './booking.entity';
import { Service } from '../services/service.entity';

import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Service]), // ✔ FIXED
    NotificationModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}

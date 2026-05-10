// src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController, ChatClientController } from './admin.controller';
import { AdminService } from './admin.service';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Payment } from '../payments/payment.entity';
import { ChatMessage } from '../chat/chat-message.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Service, Payment, ChatMessage]),
    NotificationModule,
  ],
  controllers: [AdminController, ChatClientController], // ChatClientController has no auth guard
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
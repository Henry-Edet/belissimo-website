import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { BookingsModule } from '../bookings/booking.module';
import { PaymentsModule } from '../payments/payments.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [BookingsModule, PaymentsModule, ServicesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}

// src/bookings/bookings.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { Booking } from './booking.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingService.create(createBookingDto);
  }

  /**
   * GET /bookings/availability/check
   */
  @Get('availability/check')
  async checkAvailability(@Query() query: any) {
    try {
      const { serviceId, startAt, durationMinutes } = query;

      console.log('📥 Availability request:', query);

      if (!serviceId || !startAt) {
        throw new BadRequestException('serviceId and startAt are required');
      }

      const start = new Date(startAt);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid startAt date');
      }

      const minutes =
        durationMinutes !== undefined ? Number(durationMinutes) : undefined;

      return await this.bookingService.checkAvailability(
        serviceId,
        start,
        minutes,
      );
    } catch (err: any) {
      // 🔥 THIS IS WHAT YOU’VE BEEN MISSING
      console.error('🔥 Availability check crashed:', err);
      console.error('🔥 Stack:', err?.stack);

      throw err; // let Nest return proper status
    }
  }}
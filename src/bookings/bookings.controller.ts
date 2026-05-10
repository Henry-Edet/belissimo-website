// src/bookings/bookings.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './booking.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  // ── POST /bookings ─────────────────────────────────────────────────────────
  // Works for both guests and logged-in users
  // JwtOptionalGuard extracts userId if token present, never blocks guests
  @Post()
  @UseGuards(JwtOptionalGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any,
  ): Promise<Booking> {
    const userId = req.user?.sub ?? undefined;
    console.log('👤 Booking userId:', userId); // debug log
    return this.bookingService.create(createBookingDto, userId);
  }

  // ── GET /bookings/stats ────────────────────────────────────────────────────
  @Get('stats')
  async getStats() {
    return this.bookingService.getStats();
  }

  // ── GET /bookings/my-bookings ──────────────────────────────────────────────
  // Protected — requires valid JWT
  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Request() req: any): Promise<Booking[]> {
    return this.bookingService.findMyBookings(req.user.sub);
  }

  // ── GET /bookings/availability/check ──────────────────────────────────────
  @Get('availability/check')
  async checkAvailability(@Query() query: any) {
    try {
      const { serviceId, startAt, durationMinutes } = query;
      if (!serviceId || !startAt) {
        throw new BadRequestException('serviceId and startAt are required');
      }
      const start = new Date(startAt);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid startAt date');
      }
      const minutes = durationMinutes !== undefined ? Number(durationMinutes) : undefined;
      return await this.bookingService.checkAvailability(serviceId, start, minutes);
    } catch (err: any) {
      console.error('🔥 Availability check crashed:', err);
      throw err;
    }
  }

  // ── PATCH /bookings/:id/cancel ─────────────────────────────────────────────
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string): Promise<Booking> {
    return this.bookingService.cancelBooking(parseInt(id, 10));
  }
}
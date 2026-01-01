// src/bookings/bookings.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Check availability endpoint
  @Get('availability/check')
  @UsePipes(new ValidationPipe({ transform: true }))
  async checkAvailability(@Query() checkAvailabilityDto: CheckAvailabilityDto) {
    return this.bookingsService.checkAvailability(checkAvailabilityDto);
  }

  // Create booking
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  // Get all bookings for a specific date
  @Get()
  findByDate(@Query('date') date: string) {
    if (!date) {
      return this.bookingsService.findAll();
    }
    return this.bookingsService.findByDate(date);
  }

  // Get booking by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  // Update booking status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'confirmed' | 'cancelled',
  ) {
    return this.bookingsService.updateStatus(+id, status);
  }

  // Update payment info
  @Patch(':id/payment')
  updatePaymentInfo(
    @Param('id') id: string,
    @Body() paymentData: { depositAmount?: number; totalAmount?: number; paymentStatus?: string },
  ) {
    return this.bookingsService.updatePaymentInfo(+id, paymentData);
  }

  // Delete booking
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(+id);
  }
}
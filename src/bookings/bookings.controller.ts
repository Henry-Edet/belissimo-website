import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() data: CreateBookingDto) {
    return this.bookingsService.create(data);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(Number(id));
  }

  @Get('service/:serviceId')
  getByService(@Param('serviceId') serviceId: string) {
    return this.bookingsService.findByService(serviceId);
}


  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateBookingDto) {
    return this.bookingsService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(Number(id));
  }
}

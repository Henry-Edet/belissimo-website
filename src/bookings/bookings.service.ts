import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  create(data: CreateBookingDto) {
    const booking = this.bookingRepo.create({
      ...data,
      serviceId: typeof data.serviceId === 'number' ? String(data.serviceId) : data.serviceId,
    });
    return this.bookingRepo.save(booking);
  }

  findAll() {
    return this.bookingRepo.find();
  }

  findOne(id: number) {
    return this.bookingRepo.findOne({ where: { id: String(id) } });
  }

  async update(id: number, data: UpdateBookingDto) {
    const exists = await this.findOne(id);
    if (!exists) throw new NotFoundException(`Booking ${id} not found`);
    const payload: Partial<Booking> = {
      ...data,
      serviceId: typeof data.serviceId === 'number' ? String(data.serviceId) : data.serviceId,
    };
    await this.bookingRepo.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: number) {
    const exists = await this.findOne(id);
    if (!exists) throw new NotFoundException(`Booking ${id} not found`);
    return this.bookingRepo.delete(id);
  }

  async findByService(serviceId: string): Promise<Booking[]> {
  return this.bookingRepo.find({
    where: { serviceId },
    order: { date: 'ASC', time: 'ASC' }, // optional: sorted nicely
  });
}

}

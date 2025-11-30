import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/service.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(dto: CreateBookingDto) {
    // get service
    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // parse startAt
    const start = new Date(dto.startAt);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startAt datetime format');
    }

    // compute endAt
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    // conflict check
    const conflict = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.serviceId = :serviceId', { serviceId: dto.serviceId })
      .andWhere('b.startAt < :end', { end })
      .andWhere('b.endAt > :start', { start })
      .getOne();

    if (conflict) {
      throw new BadRequestException('This time slot is already booked for this service');
    }

    // save
    const booking = this.bookingRepo.create({
      serviceId: dto.serviceId,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      startAt: start,
      endAt: end,
      status: 'pending',
    });

    return this.bookingRepo.save(booking);
  }

  async findAll() {
    return this.bookingRepo.find();
  }

  async findOne(id: number) {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBooking(id: number, dto: Partial<CreateBookingDto>) {
  const booking = await this.bookingRepo.findOne({ where: { id } });
  if (!booking) throw new NotFoundException('Booking not found');

  // update simple fields
  if (dto.clientName) booking.clientName = dto.clientName;
  if (dto.clientPhone) booking.clientPhone = dto.clientPhone;

  // if start date updated
  if (dto.startAt) {
    const start = new Date(dto.startAt);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startAt datetime');
    }

    // get service to recalc duration
    const service = await this.serviceRepo.findOne({
      where: { id: booking.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    // conflict check
    const conflict = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.serviceId = :serviceId', { serviceId: booking.serviceId })
      .andWhere('b.id != :id', { id })
      .andWhere('b.startAt < :end', { end })
      .andWhere('b.endAt > :start', { start })
      .getOne();

    if (conflict) {
      throw new BadRequestException('This time slot is already booked');
    }

    booking.startAt = start;
    booking.endAt = end;
  }

  return this.bookingRepo.save(booking);
}

async cancelBooking(id: number) {
  const booking = await this.bookingRepo.findOne({ where: { id } });
  if (!booking) throw new NotFoundException('Booking not found');

  booking.status = 'cancelled';
  return this.bookingRepo.save(booking);
}
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/service.entity';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    private readonly notificationService: NotificationsService, // FIXED ✔
  ) {}

  async create(dto: CreateBookingDto) {
    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId },
    });

    if (!service) throw new NotFoundException('Service not found');

    const start = new Date(dto.startAt);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startAt datetime format');
    }

    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    const conflict = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.serviceId = :serviceId', { serviceId: dto.serviceId })
      .andWhere('b.startAt < :end', { end })
      .andWhere('b.endAt > :start', { start })
      .getOne();

    if (conflict) {
      throw new BadRequestException('This time slot is already booked for this service');
    }

    const booking = this.bookingRepo.create({
      serviceId: dto.serviceId,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      startAt: start,
      endAt: end,
      status: 'pending',
    });

    const saved = await this.bookingRepo.save(booking);

    // 🔔 Notify Owner
    await this.notificationService.notifyNewBooking(saved);

    return saved;
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

    if (dto.clientName) booking.clientName = dto.clientName;
    if (dto.clientPhone) booking.clientPhone = dto.clientPhone;

    if (dto.startAt) {
      const start = new Date(dto.startAt);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid startAt datetime');
      }

      const service = await this.serviceRepo.findOne({
        where: { id: booking.serviceId },
      });

      if (!service) throw new NotFoundException('Service not found');

      const end = new Date(start.getTime() + service.durationMinutes * 60_000);

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

    const saved = await this.bookingRepo.save(booking);

    // 🔔 Notify owner
    await this.notificationService.notifyCancelledBooking(saved);

    return saved;
  }
}

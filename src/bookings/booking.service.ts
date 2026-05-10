import { Injectable, ConflictException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/service.entity';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId?: number): Promise<Booking> {
    console.log('📝 Creating booking:', createBookingDto);

    const { serviceId, clientName, clientPhone, startAt, subServiceName } = createBookingDto;

    if (!serviceId || !clientName || !clientPhone || !startAt) {
      throw new BadRequestException('All fields are required');
    }

    const start = new Date(startAt);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start date');
    }

    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    const duration = service.durationMinutes || 120;
    const endAt = new Date(start.getTime() + duration * 60000);

    const overlaps = await this.bookingRepository
      .createQueryBuilder('b')
      .where('b."serviceId" = :serviceId', { serviceId })
      .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('b."startAt" < :endAt AND b."endAt" > :startAt', { startAt: start, endAt })
      .getCount();

    if (overlaps > 0) throw new ConflictException('This time slot is already booked');

    const booking = this.bookingRepository.create({
      serviceId,
      clientName,
      clientPhone,
      startAt: start,
      endAt,
      status: 'pending',
      subServiceName,
      userId, // ✅ saves user id if logged in, undefined for guests
    });

    try {
      const saved = await this.bookingRepository.save(booking);
      console.log('✅ Booking created:', saved.id);
      // ✅ Notify owner of new booking
      await this.notifications.notifyNewBooking(saved);
      return saved;
    } catch (error: any) {
      if (error.code === '23P01') {
        throw new ConflictException('This time slot was just booked by another customer');
      }
      throw error;
    }
  }

  // ✅ NEW: Get bookings for logged-in user
  async findMyBookings(userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      order: { startAt: 'DESC' },
      relations: ['service'],
    });
  }

  async checkAvailability(
    serviceId: string,
    startAt: Date,
    durationMinutes?: number,
  ): Promise<{ available: boolean; message?: string }> {
    try {
      const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
      if (!service) return { available: false, message: 'Service not found' };

      const duration = durationMinutes || service.durationMinutes || 120;
      const endAt = new Date(startAt.getTime() + duration * 60000);

      const overlapping = await this.bookingRepository
        .createQueryBuilder('booking')
        .where('booking."serviceId" = :serviceId', { serviceId })
        .andWhere('booking.status != :cancelled', { cancelled: 'cancelled' })
        .andWhere('booking."startAt" < :endAt AND booking."endAt" > :startAt', { startAt, endAt })
        .getCount();

      return overlapping > 0
        ? { available: false, message: 'Time slot is already booked' }
        : { available: true };
    } catch (error) {
      return { available: false, message: 'Error checking availability' };
    }
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } as any });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return booking;
  }

  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'cancelled';
    const saved = await this.bookingRepository.save(booking);
    // ✅ Notify owner when client cancels
    await this.notifications.notifyCancelledBooking(saved);
    return saved;
  }

  // ── NEW: Stats endpoint ───────────────────────────────────────────────────
  async getStats(): Promise<{
    totalClients: number;
    satisfactionRate: number;
    totalReviews: number;
  }> {
    // Count unique clients by phone number (each unique phone = one client)
    const clientResult = await this.bookingRepository
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b."clientPhone")', 'count')
      .where('b.status != :cancelled', { cancelled: 'cancelled' })
      .getRawOne();

    const totalClients = parseInt(clientResult?.count || '0', 10);

    // Satisfaction = percentage of completed + confirmed bookings vs total
    const totalBookings = await this.bookingRepository.count();
    const positiveBookings = await this.bookingRepository.count({
      where: [{ status: 'completed' }, { status: 'confirmed' }] as any,
    });

    const satisfactionRate =
      totalBookings > 0
        ? Math.round((positiveBookings / totalBookings) * 100)
        : 98; // fallback default

    return {
      totalClients,
      satisfactionRate,
      totalReviews: totalBookings, // use total bookings as proxy until reviews table exists
    };
  }
}
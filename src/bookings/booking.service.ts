// src/bookings/booking.service.ts
import {
  Injectable,
  ConflictException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/service.entity';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * CREATE BOOKING
   * DB constraint is the final authority (booking_no_overlap).
   */
async create(createBookingDto: CreateBookingDto): Promise<Booking> {
  console.log('📝 Creating booking:', createBookingDto);
  
  const { serviceId, clientName, clientPhone, startAt, subServiceName } = createBookingDto;
  
  // Basic validation
  if (!serviceId || !clientName || !clientPhone || !startAt) {
    throw new BadRequestException('All fields are required');
  }
  
  const start = new Date(startAt);
  if (isNaN(start.getTime())) {
    throw new BadRequestException('Invalid start date');
  }
  
  // Get service for duration
  const service = await this.serviceRepository.findOne({ 
    where: { id: serviceId } 
  });
  
  if (!service) {
    throw new NotFoundException('Service not found');
  }
  
  const duration = service.durationMinutes || 120;
  const endAt = new Date(start.getTime() + duration * 60000);
  
  // Check for overlaps using EXACT column names
  const overlaps = await this.bookingRepository
    .createQueryBuilder('b')
    .where('b.\"serviceId\" = :serviceId', { serviceId }) // Quotes for camelCase!
    .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
    .andWhere('b.\"startAt\" < :endAt AND b.\"endAt\" > :startAt', { 
      startAt: start, 
      endAt 
    })
    .getCount();
  
  if (overlaps > 0) {
    throw new ConflictException('This time slot is already booked');
  }
  
  const booking = this.bookingRepository.create({
    serviceId,       // camelCase
    clientName,      // camelCase
    clientPhone,     // camelCase
    startAt: start,  // camelCase
    endAt,           // camelCase
    status: 'pending',
    subServiceName,  // camelCase
  });
  
  try {
    const savedBooking = await this.bookingRepository.save(booking);
    console.log('✅ Booking created:', savedBooking.id);
    return savedBooking;
  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    
    // Handle PostgreSQL exclusion constraint violation
    if (error.code === '23P01') {
      throw new ConflictException(
        'This time slot was just booked by another customer'
      );
    }
    
    throw error;
  }
}


private async checkOverlappingBooking(
  serviceId: string,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: number,
): Promise<boolean> {
  const query = this.bookingRepository
    .createQueryBuilder('b')
    .where('b.\"serviceId\" = :serviceId', { serviceId }) // Quotes!
    .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
    .andWhere('b.\"startAt\" < :endAt AND b.\"endAt\" > :startAt', {
      startAt,
      endAt,
    });

  if (excludeBookingId) {
    query.andWhere('b.id != :excludeBookingId', { excludeBookingId });
  }

  const count = await query.getCount();
  return count > 0;
}

 
async checkAvailability(
  serviceId: string,
  startAt: Date,
  durationMinutes?: number,
): Promise<{ available: boolean; message?: string }> {
  try {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    
    if (!service) {
      return { available: false, message: 'Service not found' };
    }

    const duration = durationMinutes || service.durationMinutes || 120;
    const endAt = new Date(startAt.getTime() + duration * 60000);

    // Use quotes for camelCase columns!
    const overlapping = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.\"serviceId\" = :serviceId', { serviceId })
      .andWhere('booking.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('booking.\"startAt\" < :endAt AND booking.\"endAt\" > :startAt', {
        startAt,
        endAt,
      })
      .getCount();

    if (overlapping > 0) {
      return { available: false, message: 'Time slot is already booked' };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, message: 'Error checking availability' };
  }
}

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } as any });
    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }
    return booking;
  }

  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = 'cancelled';
    return this.bookingRepository.save(booking);
  }
}

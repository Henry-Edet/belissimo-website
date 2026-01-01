// src/bookings/bookings.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, DataSource, In } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Service } from '../services/service.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    
    private dataSource: DataSource,
  ) {}

  // Check availability with sub-service consideration
  async checkAvailability(checkAvailabilityDto: CheckAvailabilityDto) {
    const { serviceId, subServiceName, startAt } = checkAvailabilityDto;
    
    // 1. Verify the service exists
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 2. Parse the start time
    const startTime = new Date(startAt);
    const duration = service.durationMinutes || 120; // Default to 2 hours if not specified
    const endTime = new Date(startTime.getTime() + duration * 60000);

    console.log(`🔍 Checking availability for:`, {
      serviceId,
      subServiceName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration
    });

    // 3. Check for overlapping bookings for the SAME sub-service
    const overlappingSameServiceBookings = await this.bookingsRepository.find({
      where: {
        serviceId,
        subServiceName,
        status: In(['pending', 'confirmed']), // Only check active bookings
        startAt: LessThan(endTime),
        endAt: MoreThan(startTime),
      },
    });

    console.log(`📊 Found ${overlappingSameServiceBookings.length} overlapping bookings for same sub-service`);

    // 4. Check for total capacity (all sub-services of this main service)
    const overlappingAllBookings = await this.bookingsRepository.find({
      where: {
        serviceId,
        status: In(['pending', 'confirmed']),
        startAt: LessThan(endTime),
        endAt: MoreThan(startTime),
      },
    });

    console.log(`📊 Found ${overlappingAllBookings.length} total overlapping bookings`);

    // 5. Apply business rules
    const maxSameSubService = 1; // Maximum 1 booking per specific sub-service
    const maxTotalCapacity = 3; // Maximum 3 total bookings for this main service time slot

    const isAvailable = 
      overlappingSameServiceBookings.length < maxSameSubService &&
      overlappingAllBookings.length < maxTotalCapacity;

    // 6. Return detailed availability information
    return {
      available: isAvailable,
      serviceName: service.name,
      subServiceName,
      requestedStart: startTime,
      requestedEnd: endTime,
      durationMinutes: duration,
      conflictingBookings: {
        sameSubService: overlappingSameServiceBookings.length,
        total: overlappingAllBookings.length,
      },
      limits: {
        maxSameSubService,
        maxTotalCapacity,
      },
      message: isAvailable 
        ? 'Time slot is available'
        : overlappingSameServiceBookings.length >= maxSameSubService
          ? 'This specific service is already booked at this time'
          : 'Time slot has reached maximum capacity',
    };
  }

  // Create booking with transaction to prevent race conditions
  async create(createBookingDto: CreateBookingDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { serviceId, subServiceName, startAt, durationMinutes, ...rest } = createBookingDto;
      
      // 1. Verify the service exists
      const service = await queryRunner.manager.findOne(Service, {
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // 2. Calculate end time
      const startTime = new Date(startAt);
      const duration = durationMinutes || service.durationMinutes || 120;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // 3. Check availability WITHIN TRANSACTION (prevents race conditions)
      const overlappingSameServiceBookings = await queryRunner.manager.find(Booking, {
        where: {
          serviceId,
          subServiceName,
          status: In(['pending', 'confirmed']),
          startAt: LessThan(endTime),
          endAt: MoreThan(startTime),
        },
      });

      const overlappingAllBookings = await queryRunner.manager.find(Booking, {
        where: {
          serviceId,
          status: In(['pending', 'confirmed']),
          startAt: LessThan(endTime),
          endAt: MoreThan(startTime),
        },
      });

      const maxSameSubService = 1;
      const maxTotalCapacity = 3;

      if (overlappingSameServiceBookings.length >= maxSameSubService) {
        throw new ConflictException('This specific service is already booked at this time');
      }

      if (overlappingAllBookings.length >= maxTotalCapacity) {
        throw new ConflictException('Time slot has reached maximum capacity');
      }

      // 4. Create the booking
      const status: Booking['status'] = (createBookingDto.status as Booking['status']) ?? 'pending';

      const booking = queryRunner.manager.create(Booking, {
        serviceId,
        subServiceName,
        startAt: startTime,
        endAt: endTime,
        durationMinutes: duration,
        priceCents: createBookingDto.priceCents || service.priceCents,
        status,
        ...rest,
      });

      const savedBooking = await queryRunner.manager.save(booking);
      
      // 5. Commit transaction
      await queryRunner.commitTransaction();

      console.log(`✅ Booking created successfully:`, {
        id: savedBooking.id,
        serviceId,
        subServiceName,
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
      });

      return savedBooking;

    } catch (error) {
      // 6. Rollback on error
      await queryRunner.rollbackTransaction();
      console.error('❌ Booking creation failed:', error.message);
      throw error;
    } finally {
      // 7. Release query runner
      await queryRunner.release();
    }
  }

  // Get bookings by date
  async findByDate(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.bookingsRepository.find({
      where: {
        startAt: Between(startOfDay, endOfDay),
      },
      order: {
        startAt: 'ASC',
      },
    });
  }

  // List all bookings
  async findAll() {
    return this.bookingsRepository.find({
      order: { startAt: 'ASC' },
    });
  }

  // Get booking by ID
  async findOne(id: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: [], // Add relations if needed
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  // Update booking fields
  async updateBooking(id: number, updates: Partial<CreateBookingDto>) {
    const booking = await this.findOne(id);

    if (updates.status) {
      booking.status = updates.status as Booking['status'];
    }

    Object.assign(booking, {
      ...updates,
      status: booking.status,
    });

    return this.bookingsRepository.save(booking);
  }

  // Cancel a booking
  async cancelBooking(id: number) {
    return this.updateStatus(id, 'cancelled');
  }

  // Update booking status (e.g., after payment)
  async updateStatus(id: number, status: 'pending' | 'confirmed' | 'cancelled') {
    const booking = await this.findOne(id);
    
    booking.status = status;
    return this.bookingsRepository.save(booking);
  }

  // Update booking with payment info
  async updatePaymentInfo(id: number, paymentData: { depositAmount?: number; totalAmount?: number; paymentStatus?: string }) {
    const booking = await this.findOne(id);
    
    Object.assign(booking, paymentData);
    return this.bookingsRepository.save(booking);
  }

  // Delete booking
  async remove(id: number) {
    const booking = await this.findOne(id);
    return this.bookingsRepository.remove(booking);
  }
}

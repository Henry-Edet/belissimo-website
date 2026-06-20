import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Service } from '../services/service.entity';
import { NotificationsService } from '../notifications/notification.service';
export declare class BookingService {
    private readonly bookingRepository;
    private readonly serviceRepository;
    private readonly notifications;
    private readonly logger;
    constructor(bookingRepository: Repository<Booking>, serviceRepository: Repository<Service>, notifications: NotificationsService);
    create(createBookingDto: CreateBookingDto, userId?: number): Promise<Booking>;
    findMyBookings(userId: number): Promise<Booking[]>;
    findByClientPhone(clientPhone: string): Promise<Booking[]>;
    checkAvailability(serviceId: string, startAt: Date, durationMinutes?: number): Promise<{
        available: boolean;
        message?: string;
    }>;
    findOne(id: number): Promise<Booking>;
    cancelBooking(id: number): Promise<Booking>;
    getStats(): Promise<{
        totalClients: number;
        satisfactionRate: number;
        totalReviews: number;
    }>;
}

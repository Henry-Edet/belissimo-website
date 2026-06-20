import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './booking.entity';
export declare class BookingsController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    create(createBookingDto: CreateBookingDto, req: any): Promise<Booking>;
    getStats(): Promise<{
        totalClients: number;
        satisfactionRate: number;
        totalReviews: number;
    }>;
    getMyBookings(req: any): Promise<Booking[]>;
    checkAvailability(query: any): Promise<{
        available: boolean;
        message?: string;
    }>;
    cancel(id: string): Promise<Booking>;
}

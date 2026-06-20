import { Booking } from '../bookings/booking.entity';
export declare class Service {
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    priceCents: number;
    depositPercentage: number;
    tag?: string;
    imageUrl?: string;
    createdAt: Date;
    bookings: Booking[];
}

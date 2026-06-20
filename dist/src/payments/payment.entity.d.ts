import { Booking } from '../bookings/booking.entity';
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    REFUNDED = "REFUNDED"
}
export declare class Payment {
    id: number;
    booking: Booking;
    bookingId: number;
    amountCents: number;
    currency: string;
    provider: string;
    status: PaymentStatus;
    providerId: string;
    createdAt: Date;
}

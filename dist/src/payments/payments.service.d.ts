import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Payment } from './payment.entity';
import { PaymentNotification } from './payment-notification.entity';
import { Service } from '../services/service.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notification.service';
export declare class PaymentsService {
    private paymentsRepo;
    private bookingRepo;
    private serviceRepo;
    private notificationRepo;
    private config;
    private notifications;
    private stripe;
    private readonly logger;
    constructor(paymentsRepo: Repository<Payment>, bookingRepo: Repository<Booking>, serviceRepo: Repository<Service>, notificationRepo: Repository<PaymentNotification>, config: ConfigService, notifications: NotificationsService);
    createCheckoutSession(bookingId: number): Promise<{
        url: string | null;
        sessionId: string;
        paymentId: number;
    }>;
    createBalanceCheckoutSession(bookingId: number): Promise<{
        url: string | null;
        sessionId: string;
        paymentId: number;
    }>;
    handleStripeCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>;
    notifyDepositEmail(dto: {
        bookingId: number;
        clientName: string;
        clientPhone?: string;
        amountCents: number;
        paymentMethod: 'bank_transfer' | 'crypto';
    }): Promise<{
        message: string;
    }>;
    notifyManualPayment(dto: {
        bookingId: number;
        clientName: string;
        clientPhone?: string;
        amountCents: number;
        paymentMethod: 'bank_transfer' | 'crypto' | 'card';
        reference?: string;
        isBalancePayment: boolean;
    }): Promise<PaymentNotification>;
    getPendingNotifications(): Promise<PaymentNotification[]>;
    getAllNotifications(): Promise<PaymentNotification[]>;
    confirmNotification(notificationId: number, adminNote?: string): Promise<{
        notification: PaymentNotification;
        booking: Booking;
    }>;
    rejectNotification(notificationId: number, adminNote?: string): Promise<PaymentNotification>;
}

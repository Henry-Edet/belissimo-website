import { PaymentsService } from './payments.service';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly config;
    private readonly logger;
    private readonly stripe;
    constructor(paymentsService: PaymentsService, config: ConfigService);
    createSession(body: {
        bookingId: number;
    }): Promise<{
        url: string | null;
        sessionId: string;
        paymentId: number;
    }>;
    createBalanceSession(body: {
        bookingId: number;
    }): Promise<{
        url: string | null;
        sessionId: string;
        paymentId: number;
    }>;
    handleWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    notifyDeposit(body: {
        bookingId: number;
        clientName: string;
        clientPhone?: string;
        amountCents: number;
        paymentMethod: 'bank_transfer' | 'crypto';
    }): Promise<{
        message: string;
    }>;
    notifyPayment(body: {
        bookingId: number;
        clientName: string;
        clientPhone?: string;
        amountCents: number;
        paymentMethod: 'bank_transfer' | 'crypto' | 'card';
        reference?: string;
        isBalancePayment: boolean;
    }): Promise<import("./payment-notification.entity").PaymentNotification>;
    notifyStripeBalance(body: {
        bookingId: number;
        clientName: string;
        amountCents: number;
    }): Promise<import("./payment-notification.entity").PaymentNotification>;
    getNotifications(): Promise<import("./payment-notification.entity").PaymentNotification[]>;
    confirmNotification(id: string, body: {
        adminNote?: string;
    }): Promise<{
        notification: import("./payment-notification.entity").PaymentNotification;
        booking: import("../bookings/booking.entity").Booking;
    }>;
    rejectNotification(id: string, body: {
        adminNote?: string;
    }): Promise<import("./payment-notification.entity").PaymentNotification>;
}

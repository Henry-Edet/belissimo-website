import { Repository } from 'typeorm';
import { BookingService } from '../bookings/booking.service';
import { PaymentsService } from '../payments/payments.service';
import { ServicesService } from '../services/services.service';
import { ChatMessage } from '../chat/chat-message.entity';
export declare class AiService {
    private readonly bookingService;
    private readonly paymentsService;
    private readonly servicesService;
    private readonly chatRepo;
    private readonly logger;
    constructor(bookingService: BookingService, paymentsService: PaymentsService, servicesService: ServicesService, chatRepo: Repository<ChatMessage>);
    private getMemory;
    private saveMemory;
    private callLLM;
    private extractJSON;
    handleMessage(message: string, userId?: string, numericUserId?: number): Promise<{
        reply: string;
        action: string;
        bookingId?: undefined;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents: number;
        awaitingPaymentMethod: boolean;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    }>;
    private persistMessage;
    handleMessageAndPersist(message: string, userId?: string, clientName?: string | null): Promise<{
        reply: string;
        action: string;
        bookingId?: undefined;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents: number;
        awaitingPaymentMethod: boolean;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    }>;
}

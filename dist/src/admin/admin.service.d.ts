import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Payment } from '../payments/payment.entity';
import { ChatMessage } from '../chat/chat-message.entity';
import { NotificationsService } from '../notifications/notification.service';
export declare const takenOverSessions: Set<string>;
export declare class AdminService {
    private readonly bookingRepo;
    private readonly userRepo;
    private readonly serviceRepo;
    private readonly paymentRepo;
    private readonly chatRepo;
    private readonly notifications;
    private readonly logger;
    constructor(bookingRepo: Repository<Booking>, userRepo: Repository<User>, serviceRepo: Repository<Service>, paymentRepo: Repository<Payment>, chatRepo: Repository<ChatMessage>, notifications: NotificationsService);
    getStats(): Promise<{
        totalBookings: number;
        pending: number;
        confirmed: number;
        cancelled: number;
        completed: number;
        totalClients: number;
        totalRevenue: string;
        totalPayments: number;
        aiBookings: number;
        recentBookings: Booking[];
    }>;
    getRevenue(): Promise<{
        totalRevenueCents: number;
        totalRevenue: string;
        paymentCount: number;
        byMonth: {
            month: string;
            revenue: string;
            cents: number;
        }[];
        recentPayments: Payment[];
    }>;
    getAllBookings(status?: string, limit?: number, offset?: number): Promise<{
        bookings: Booking[];
        total: number;
    }>;
    confirmBooking(id: number): Promise<Booking>;
    cancelBooking(id: number): Promise<Booking>;
    markOwing(id: number, balanceCents: number): Promise<Booking>;
    markCompleted(id: number): Promise<Booking>;
    getAllClients(): Promise<User[]>;
    getChatSessions(): Promise<any[]>;
    getChatSession(sessionId: string): Promise<ChatMessage[]>;
    flagSession(sessionId: string): Promise<{
        message: string;
    }>;
    takeoverSession(sessionId: string): Promise<{
        sessionId: string;
        takenOver: boolean;
    }>;
    releaseSession(sessionId: string): Promise<{
        sessionId: string;
        takenOver: boolean;
    }>;
    sendAdminChatMessage(sessionId: string, message: string): Promise<ChatMessage>;
    getClientSessionMessages(sessionId: string): Promise<ChatMessage[]>;
    clearAllChatHistory(): Promise<{
        deleted: number;
    }>;
    cleanupOldMessages(): Promise<number>;
}

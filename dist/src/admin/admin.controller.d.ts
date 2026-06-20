import { AdminService } from './admin.service';
export declare class ChatClientController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getClientMessages(sessionId: string): Promise<import("../chat/chat-message.entity").ChatMessage[]>;
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
        recentBookings: import("../bookings/booking.entity").Booking[];
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
        recentPayments: import("../payments/payment.entity").Payment[];
    }>;
    getAllBookings(status?: string, limit?: string, offset?: string): Promise<{
        bookings: import("../bookings/booking.entity").Booking[];
        total: number;
    }>;
    confirmBooking(id: string): Promise<import("../bookings/booking.entity").Booking>;
    cancelBooking(id: string): Promise<import("../bookings/booking.entity").Booking>;
    markOwing(id: string, body: {
        balanceCents: number;
    }): Promise<import("../bookings/booking.entity").Booking>;
    markCompleted(id: string): Promise<import("../bookings/booking.entity").Booking>;
    getAllClients(): Promise<import("../users/user.entity").User[]>;
    getChatSessions(): Promise<any[]>;
    getChatSession(sessionId: string): Promise<import("../chat/chat-message.entity").ChatMessage[]>;
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
    sendAdminMessage(sessionId: string, body: {
        message: string;
    }): Promise<import("../chat/chat-message.entity").ChatMessage>;
    clearAllChat(): Promise<{
        deleted: number;
    }>;
}

export declare class NotificationsService {
    private readonly logger;
    private transporter;
    constructor();
    sendOwnerEmail(subject: string, text: string): Promise<void>;
    notifyNewBooking(booking: any): Promise<void>;
    notifyCancelledBooking(booking: any): Promise<void>;
    notifyPaymentSuccess(booking: any): Promise<void>;
}

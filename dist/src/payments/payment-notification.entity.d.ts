export declare enum NotificationStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    REJECTED = "rejected"
}
export declare class PaymentNotification {
    id: number;
    bookingId: number;
    clientName: string;
    clientPhone?: string;
    amountCents: number;
    paymentMethod: string;
    reference?: string;
    status: NotificationStatus;
    adminNote?: string;
    createdAt: Date;
    confirmedAt?: Date;
}

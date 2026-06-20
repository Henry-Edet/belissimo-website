import { Service } from '../services/service.entity';
export declare enum PaymentStatus {
    NONE = "none",
    DEPOSIT_PAID = "deposit_paid",
    OWING = "owing",
    COMPLETED = "completed"
}
export declare class Booking {
    id: number;
    serviceId: string;
    service: Service;
    clientName: string;
    clientPhone: string;
    userId?: number;
    startAt: Date;
    endAt: Date;
    status: string;
    subServiceName?: string;
    paymentStatus: PaymentStatus;
    balanceCents: number;
}

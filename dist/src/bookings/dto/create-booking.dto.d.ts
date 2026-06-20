export declare class CreateBookingDto {
    serviceId: string;
    clientName: string;
    clientPhone: string;
    startAt: Date | string;
    endAt?: Date;
    subServiceName?: string;
}

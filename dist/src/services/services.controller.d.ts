import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    findAll(): Promise<import("./service.entity").Service[]>;
    findOne(id: string): Promise<import("./service.entity").Service>;
    create(body: {
        name: string;
        priceCents: string;
        durationMinutes: string;
        description?: string;
        tag?: string;
    }, file?: Express.Multer.File): Promise<import("./service.entity").Service>;
    update(id: string, body: {
        name?: string;
        priceCents?: string;
        durationMinutes?: string;
        description?: string;
        tag?: string;
    }, file?: Express.Multer.File): Promise<import("./service.entity").Service>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

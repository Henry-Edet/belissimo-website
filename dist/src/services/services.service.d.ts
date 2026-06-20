import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { AwsService } from '../aws/aws.service';
export declare class ServicesService {
    private readonly serviceRepo;
    private readonly awsService;
    constructor(serviceRepo: Repository<Service>, awsService: AwsService);
    findAll(): Promise<Service[]>;
    findOne(id: string): Promise<Service>;
    createService(dto: {
        name: string;
        priceCents: number;
        durationMinutes: number;
        description?: string;
        tag?: string;
        imageFile?: Express.Multer.File;
    }): Promise<Service>;
    updateService(id: string, dto: {
        name?: string;
        priceCents?: number;
        durationMinutes?: number;
        description?: string;
        tag?: string;
        imageFile?: Express.Multer.File;
    }): Promise<Service>;
    deleteService(id: string): Promise<{
        message: string;
    }>;
}

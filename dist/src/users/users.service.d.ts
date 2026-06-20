import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findById(id: number): Promise<Partial<User>>;
    updateProfile(id: number, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<Partial<User>>;
    changePassword(id: number, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}

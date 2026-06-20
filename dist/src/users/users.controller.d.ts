import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<Partial<import("./user.entity").User>>;
    updateMe(req: any, body: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<Partial<import("./user.entity").User>>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}

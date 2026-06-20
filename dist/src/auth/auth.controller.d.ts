import { AuthService } from './auth.service';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(body: {
        email: string;
        password: string;
        role?: string;
    }): Promise<{
        message: string;
        email: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(req: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<void>;
}

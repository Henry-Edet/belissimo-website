import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '../users/user.entity';
export declare class AuthService {
    private userRepo;
    private jwt;
    constructor(userRepo: Repository<User>, jwt: JwtService);
    register(email: string, password: string, role?: Role): Promise<{
        message: string;
        email: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    updateRefreshToken(userId: number, refreshToken: string): Promise<void>;
    refreshTokens(userId: number, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: number): Promise<void>;
}

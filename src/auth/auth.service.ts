import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, password: string) {
    // ⚠️ Replace this with real DB check
    if (email !== 'test@example.com' || password !== 'password123') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: 1, email }; // sub = userId
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }
}

// src/auth/auth.service.ts
// Uses Role enum — no more raw strings for roles

import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    // ✅ Uses Role enum, defaults to CLIENT
    role: Role = Role.CLIENT,
  ) {
    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) throw new ForbiddenException('Email already taken');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash, role });
    await this.userRepo.save(user);

    return { message: 'User created', email };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    // ✅ Use entity property name (refreshTokenHash), not column name (refresh_token_hash)
    await this.userRepo.update(userId, { refreshTokenHash: hash });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    // ✅ Fixed: check refresh_token_hash not refreshTokenHash
    if (!user || !(user as any).refresh_token_hash)
      throw new ForbiddenException('Access Denied');

    const valid = await bcrypt.compare(
      refreshToken,
      (user as any).refresh_token_hash,
    );
    if (!valid) throw new ForbiddenException('Access Denied');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number) {
    await this.userRepo.update(userId, { refreshTokenHash: undefined });
  }
}
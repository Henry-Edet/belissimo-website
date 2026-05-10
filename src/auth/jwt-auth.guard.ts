// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// ✅ Fixed: must match strategy name 'jwt-access' from JwtAccessStrategy
export class JwtAuthGuard extends AuthGuard('jwt-access') {}
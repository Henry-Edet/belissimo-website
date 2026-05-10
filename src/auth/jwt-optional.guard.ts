// src/auth/jwt-optional.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt-access') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // No token at all — guest request, just continue
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    // Token present — try to validate it
    try {
      await super.canActivate(context);
    } catch (err) {
      // Invalid/expired token — treat as guest
      request.user = null;
    }

    return true;
  }

  handleRequest(err: any, user: any) {
    // Never throw — return user if valid, null otherwise
    if (err || !user) return null;
    return user;
  }
}
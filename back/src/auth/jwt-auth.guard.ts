// US 3.3 — JWT Auth Guard: validates JWT token for authenticated endpoints
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// US 3.3 — Payload interface for decoded JWT tokens
export interface JwtPayload {
  sub: number;
  email: string;
  role?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // US 3.3
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] ?? '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de autenticación requerido.');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      // US 3.1 — Default role to USER for tokens missing the role claim (backward compat)
      if (!payload.role) {
        payload.role = 'USER'; // US 3.1
      }
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}

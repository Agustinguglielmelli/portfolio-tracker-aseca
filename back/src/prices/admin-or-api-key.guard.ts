import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminOrApiKeyGuard implements CanActivate {
  // US 3.1
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] ?? '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de autenticación requerido.');
    }
    const expectedApiKey = this.configService.get<string>('ADMIN_API_KEY');
    if (expectedApiKey && token === expectedApiKey) {
      return true; // US 3.2 — CI pipeline authenticated via API key
    }
    try {
      const payload = this.jwtService.verify<{
        sub: number;
        email: string;
        role?: string;
      }>(token);
      const role = payload.role ?? 'USER';
      if (role !== 'ADMIN') {
        throw new ForbiddenException(
          'Acceso denegado. Se requiere rol de administrador.',
        );
      }
      (request as any).user = { ...payload, role };
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] ?? '';

    const [scheme, token] = authHeader.split(' ');

    const expectedKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!expectedKey) {
      throw new ForbiddenException('Admin API key is not configured.');
    }

    if (scheme !== 'Bearer' || !token || token !== expectedKey) {
      throw new ForbiddenException('Invalid or missing admin API key.');
    }

    return true;
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module'; // US 3.1 — Provides AdminGuard, JwtAuthGuard, JwtModule
import { PrismaModule } from '../prisma/prisma.module'; // US 3.3 — Provides PrismaService for BatchLog
import { AdminOrApiKeyGuard } from './admin-or-api-key.guard'; // US 3.1 / US 3.2
import { PricesController } from './prices.controller';
import { PricesService } from './service/prices.service';

@Module({
  imports: [
    ConfigModule, // Needed by AdminOrApiKeyGuard and PricesService to read env vars
    AuthModule, // US 3.1 — Provides JwtAuthGuard and JwtModule (used by AdminOrApiKeyGuard + lastUpdate)
    PrismaModule, // US 3.3 — Provides PrismaService
  ],
  controllers: [PricesController],
  providers: [PricesService, AdminOrApiKeyGuard, ConfigService], // ConfigService for PYTHON_WORKER_URL
})
export class PricesModule {}

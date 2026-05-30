import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module'; // US 3.1 — Provides AdminGuard, JwtAuthGuard, JwtModule
import { PrismaModule } from '../prisma/prisma.module'; // US 3.3 — Provides PrismaService for BatchLog
import { AdminOrApiKeyGuard } from './admin-or-api-key.guard'; // US 3.1 / US 3.2
import { PricesController } from './prices.controller';
import { PricesService } from './service/prices.service';

@Module({
  imports: [
    ConfigModule, // US 3.2 — Needed by AdminOrApiKeyGuard to read ADMIN_API_KEY
    AuthModule, // US 3.1 — Provides JwtAuthGuard and JwtModule (used by AdminOrApiKeyGuard + lastUpdate)
    PrismaModule, // US 3.3 — Provides PrismaService
  ],
  controllers: [PricesController],
  providers: [PricesService, AdminOrApiKeyGuard], // US 3.1
})
export class PricesModule {}

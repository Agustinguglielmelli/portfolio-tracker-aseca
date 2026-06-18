import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminOrApiKeyGuard } from './admin-or-api-key.guard';
import { PricesController } from './prices.controller';
import { PricesService } from './service/prices.service';

@Module({
  imports: [ConfigModule, AuthModule, PrismaModule],
  controllers: [PricesController],
  providers: [PricesService, AdminOrApiKeyGuard, ConfigService],
})
export class PricesModule {}

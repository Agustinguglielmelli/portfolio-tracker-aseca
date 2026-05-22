import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';

@Module({
  imports: [ConfigModule],
  controllers: [PricesController],
  providers: [PricesService, AdminApiKeyGuard],
})
export class PricesModule {}

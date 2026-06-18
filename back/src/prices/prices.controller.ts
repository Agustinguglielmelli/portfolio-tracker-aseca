import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminOrApiKeyGuard } from './admin-or-api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  BatchResult,
  LastUpdateResponse,
  PricesService,
} from './service/prices.service';

@Controller('prices')
export class PricesController {
  private readonly logger = new Logger(PricesController.name);

  constructor(private readonly pricesService: PricesService) {}

  @Post('update')
  @HttpCode(200)
  @UseGuards(AdminOrApiKeyGuard)
  async update(): Promise<{ message: string } & BatchResult> {
    this.logger.log('POST /prices/update triggered by admin.');
    const result = await this.pricesService.runUpdateBatch();
    return {
      message: 'Stock price batch update completed.',
      ...result,
    };
  }

  @Get('last-update')
  @UseGuards(JwtAuthGuard)
  async lastUpdate(): Promise<LastUpdateResponse> {
    this.logger.log('GET /prices/last-update requested.');
    return this.pricesService.getLastUpdate();
  }
}

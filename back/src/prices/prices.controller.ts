import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminOrApiKeyGuard } from './admin-or-api-key.guard'; // US 3.1
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // US 3.3
import {
  BatchResult,
  LastUpdateResponse,
  PricesService,
} from './prices.service';

@Controller('prices')
export class PricesController {
  private readonly logger = new Logger(PricesController.name);

  constructor(private readonly pricesService: PricesService) {}

  // US 3.1 — Trigger batch price update; requires ADMIN JWT or static API key (for CI)
  @Post('update')
  @HttpCode(200)
  @UseGuards(AdminOrApiKeyGuard) // US 3.1 / US 3.2 — Accepts JWT(ADMIN) or ADMIN_API_KEY
  async update(): Promise<{ message: string } & BatchResult> {
    this.logger.log('POST /prices/update triggered by admin.');
    const result = await this.pricesService.runUpdateBatch();
    return {
      message: 'Stock price batch update completed.',
      ...result,
    };
  }

  // US 3.3 — Returns the timestamp of the last batch execution and per-ticker details
  @Get('last-update')
  @UseGuards(JwtAuthGuard) // US 3.3 — Available to all authenticated users
  async lastUpdate(): Promise<LastUpdateResponse> {
    this.logger.log('GET /prices/last-update requested.');
    return this.pricesService.getLastUpdate(); // US 3.3
  }
}

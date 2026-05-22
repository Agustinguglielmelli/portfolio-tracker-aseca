import { Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { BatchResult, PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  private readonly logger = new Logger(PricesController.name);

  constructor(private readonly pricesService: PricesService) {}

  @Post('update')
  @HttpCode(200)
  @UseGuards(AdminApiKeyGuard)
  async update(): Promise<{ message: string } & BatchResult> {
    this.logger.log('POST /prices/update triggered by admin.');
    const result = await this.pricesService.runUpdateBatch();
    return {
      message: 'Stock price batch update completed.',
      ...result,
    };
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) return [];
    return this.companiesService.searchCompanies(query);
  }

  @Get(':ticker/metrics')
  async getMetrics(@Param('ticker') ticker: string) {
    return this.companiesService.getMetrics(ticker);
  }

  @Get(':ticker/filings')
  async getFilings(@Param('ticker') ticker: string) {
    return this.companiesService.getFilings(ticker);
  }

  @Get(':ticker/historical-metrics')
  async getHistoricalMetrics(@Param('ticker') ticker: string) {
    return this.companiesService.getHistoricalMetrics(ticker);
  }
}

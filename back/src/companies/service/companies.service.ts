import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from '../repository/companies.repository';
import {
  extractHistory,
  getLatestValue,
  mapFilings,
  mapSearchHit,
  sortFilingsByDateDesc,
  uniqueByCik,
} from '../utils/helpers';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async searchCompanies(query: string) {
    const data = await this.companiesRepository.searchCompaniesRaw(query);

    if (!data?.hits?.hits) return [];

    const mapped = data.hits.hits.map(mapSearchHit);

    return uniqueByCik(mapped);
  }

  async getMetrics(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData?.facts?.['us-gaap'];

    if (!gaap) {
      throw new NotFoundException('No se encontraron métricas US-GAAP');
    }

    return {
      revenue:
        getLatestValue(gaap, 'Revenues') ||
        getLatestValue(gaap, 'SalesRevenueNet'),

      netIncome: getLatestValue(gaap, 'NetIncomeLoss'),

      eps: getLatestValue(gaap, 'EarningsPerShareBasic'),

      totalAssets: getLatestValue(gaap, 'Assets'),

      totalLiabilities: getLatestValue(gaap, 'Liabilities'),
    };
  }

  async getFilings(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const data = await this.companiesRepository.getCompanySubmissionsRaw(cik);

    const recent = data?.filings?.recent;
    if (!recent) return [];

    const filings = mapFilings(recent);

    return sortFilingsByDateDesc(filings);
  }

  async getHistoricalMetrics(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData?.facts?.['us-gaap'];

    if (!gaap) {
      throw new NotFoundException('No se encontraron métricas históricas');
    }

    return {
      revenue:
        extractHistory(gaap, 'Revenues') ||
        extractHistory(gaap, 'SalesRevenueNet'),

      netIncome: extractHistory(gaap, 'NetIncomeLoss'),

      eps: extractHistory(gaap, 'EarningsPerShareBasic'),
    };
  }
}

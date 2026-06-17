import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from '../repository/companies.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async searchCompanies(query: string) {
    const cacheKey = `search_${query.trim().toLowerCase()}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit!');
      return cachedResult;
    }
    console.log('Cache miss');

    const data = await this.companiesRepository.searchCompaniesRaw(query);

    const result = data?.hits?.hits
      ? uniqueByCik(data.hits.hits.map(mapSearchHit))
      : [];

    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async getMetrics(ticker: string) {
    const cacheKey = `metrics_${ticker.toUpperCase()}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData?.facts?.['us-gaap'];

    if (!gaap) {
      throw new NotFoundException('No se encontraron métricas US-GAAP');
    }

    const result = {
      revenue:
        getLatestValue(gaap, 'Revenues') ||
        getLatestValue(gaap, 'SalesRevenueNet'),
      netIncome: getLatestValue(gaap, 'NetIncomeLoss'),
      eps: getLatestValue(gaap, 'EarningsPerShareBasic'),
      totalAssets: getLatestValue(gaap, 'Assets'),
      totalLiabilities: getLatestValue(gaap, 'Liabilities'),
    };

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getFilings(ticker: string) {
    const cacheKey = `filings_${ticker.toUpperCase()}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const data = await this.companiesRepository.getCompanySubmissionsRaw(cik);

    const recent = data?.filings?.recent;
    if (!recent) return [];

    const filings = mapFilings(recent);

    const result = sortFilingsByDateDesc(filings);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getHistoricalMetrics(ticker: string) {
    const cacheKey = `history_${ticker.toUpperCase()}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) return cachedResult;
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData?.facts?.['us-gaap'];

    if (!gaap) {
      throw new NotFoundException('No se encontraron métricas históricas');
    }

    const result = {
      revenue:
        extractHistory(gaap, 'Revenues') ||
        extractHistory(gaap, 'SalesRevenueNet'),

      netIncome: extractHistory(gaap, 'NetIncomeLoss'),

      eps: extractHistory(gaap, 'EarningsPerShareBasic'),
    };
    await this.cacheManager.set(cacheKey, result);
    return result;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from './companies.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  // US 2.1: Búsqueda
  async searchCompanies(query: string) {
    const data = await this.companiesRepository.searchCompaniesRaw(query);
    if (!data || !data.hits || !data.hits.hits) return [];

    const results = data.hits.hits.map((hit: any) => {
      const rawName = hit._source.display_names
        ? hit._source.display_names[0]
        : 'Desconocido';

      const cik =
        hit._source.ciks && hit._source.ciks.length > 0
          ? hit._source.ciks[0]
          : null;

      let cleanName = rawName;
      let ticker = null;

      if (rawName !== 'Desconocido') {
        const tickerMatch = rawName.match(/\(([^)]+)\)\s*\(CIK/);
        if (tickerMatch) {
          ticker = tickerMatch[1];
        }

        const nameMatch = rawName.match(/^(.*?)\s*\(/);
        if (nameMatch) {
          cleanName = nameMatch[1].trim();
        }
      }

      return {
        name: cleanName,
        ticker: ticker,
        cik: cik,
      };
    });

    const uniqueResults: any[] = [];
    const ciks = new Set();
    for (const res of results) {
      if (res.cik && !ciks.has(res.cik)) {
        ciks.add(res.cik);
        uniqueResults.push(res);
      }
    }
    return uniqueResults;
  }

  // US 2.2: Métricas Actuales
  async getMetrics(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData.facts['us-gaap'];
    if (!gaap)
      throw new NotFoundException('No se encontraron métricas US-GAAP');

    const getLatestValue = (concept: string) => {
      const data = gaap[concept];
      if (!data || !data.units) return null;
      // EPS usa 'USD/shares', los demás usan 'USD'
      const unitKey = data.units.USD
        ? 'USD'
        : data.units['USD/shares']
          ? 'USD/shares'
          : null;
      if (!unitKey) return null;

      const reports = data.units[unitKey].filter(
        (r: any) => r.frame && r.frame.length === 6, // Anual o Quarterly (CY2023 / CY2023Q1)
      );
      if (reports.length === 0) return null;
      reports.sort(
        (a: any, b: any) =>
          new Date(b.end).getTime() - new Date(a.end).getTime(),
      );
      return reports[0].val;
    };

    return {
      revenue: getLatestValue('Revenues') || getLatestValue('SalesRevenueNet'),
      netIncome: getLatestValue('NetIncomeLoss'),
      eps: getLatestValue('EarningsPerShareBasic'),
      totalAssets: getLatestValue('Assets'),
      totalLiabilities: getLatestValue('Liabilities'),
    };
  }

  // US 2.3: Filings Recientes
  async getFilings(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const data = await this.companiesRepository.getCompanySubmissionsRaw(cik);

    const recent = data.filings?.recent;
    if (!recent) return [];

    const filings: any[] = [];
    for (let i = 0; i < recent.form.length; i++) {
      if (recent.form[i] === '10-K' || recent.form[i] === '10-Q') {
        filings.push({
          date: recent.filingDate[i],
          type: recent.form[i],
          accessionNumber: recent.accessionNumber[i],
        });
      }
    }
    return filings.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // US 2.4: Evolución Histórica
  async getHistoricalMetrics(ticker: string) {
    const cik = this.companiesRepository.getCikByTicker(ticker);
    const factsData = await this.companiesRepository.getCompanyFactsRaw(cik);

    const gaap = factsData.facts['us-gaap'];
    if (!gaap)
      throw new NotFoundException('No se encontraron métricas históricas');

    const extractHistory = (concept: string) => {
      const data = gaap[concept];
      if (!data || !data.units) return [];
      const unitKey = data.units.USD
        ? 'USD'
        : data.units['USD/shares']
          ? 'USD/shares'
          : null;
      if (!unitKey) return [];

      const reports = data.units[unitKey].filter(
        (r: any) => r.form === '10-Q' || r.form === '10-K',
      );
      const uniqueDates = new Map();
      reports.forEach((r: any) =>
        uniqueDates.set(r.end, { date: r.end, value: r.val, form: r.form }),
      );

      const sorted = Array.from(uniqueDates.values()).sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return sorted.slice(0, 8);
    };

    return {
      revenue: extractHistory('Revenues').length
        ? extractHistory('Revenues')
        : extractHistory('SalesRevenueNet'),
      netIncome: extractHistory('NetIncomeLoss'),
      eps: extractHistory('EarningsPerShareBasic'),
    };
  }
}

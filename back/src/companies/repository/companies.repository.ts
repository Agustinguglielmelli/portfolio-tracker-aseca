import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import pLimit from 'p-limit';

@Injectable()
export class CompaniesRepository implements OnModuleInit {
  private readonly logger = new Logger(CompaniesRepository.name);

  // La SEC permite 10 requests / segundo. Poner 5 garantiza no exceder los límites si hay picos.
  private readonly secRateLimiter = pLimit(5);

  private readonly secHeaders = {
    'User-Agent': 'Portfolio-Tracker/1.0 (rgomez@mail.austral.edu.ar)',
    'Accept-Encoding': 'gzip, deflate',
    Host: 'data.sec.gov',
  };

  private tickersToCikMap: Record<string, string> = {};

  async onModuleInit() {
    try {
      const response = await fetch(
        'https://www.sec.gov/files/company_tickers.json',
        {
          headers: { 'User-Agent': this.secHeaders['User-Agent'] },
        },
      );
      const data = await response.json();
      for (const key in data) {
        const company = data[key];
        this.tickersToCikMap[company.ticker] = String(company.cik_str).padStart(
          10,
          '0',
        );
      }
      this.logger.log('Mapa de Tickers de la SEC cargado exitosamente.');
    } catch (error) {
      this.logger.error('Error cargando company_tickers.json', error);
    }
  }

  // Para que esperen las requests
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchSecApi(url: string, timeoutMs = 5000) {
    return this.secRateLimiter(async () => {
      await this.sleep(100);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: this.secHeaders,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404)
            throw new NotFoundException(
              'Recurso no encontrado en la API de la SEC',
            );
          if (response.status === 429) {
            this.logger.warn('Rate Limit de la SEC superado (429)');
            throw new ServiceUnavailableException(
              'Demasiadas solicitudes a la SEC, intente más tarde',
            );
          }
          throw new ServiceUnavailableException(
            `Error de la SEC: ${response.statusText}`,
          );
        }
        return await response.json();
      } catch (error) {
        // Validación para tratar a "error" de modo seguro
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new RequestTimeoutException('Timeout con la API de la SEC');
          }
        }

        if (
          error instanceof NotFoundException ||
          error instanceof ServiceUnavailableException
        ) {
          throw error;
        }

        throw new InternalServerErrorException(
          'Error interno al conectar con la SEC',
        );
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  getCikByTicker(ticker: string): string {
    const cik = this.tickersToCikMap[ticker.toUpperCase()];
    if (!cik)
      throw new NotFoundException(`La empresa con ticker ${ticker} no existe`);
    return cik;
  }

  async searchCompaniesRaw(query: string) {
    const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}&forms=10-K`;

    // Lo envolvemos igual en el limitador porque es un endpoint de EDGAR
    return this.secRateLimiter(async () => {
      await this.sleep(100);
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': this.secHeaders['User-Agent'] },
        });
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        return null;
      }
    });
  }

  async getCompanyFactsRaw(cik: string) {
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    return this.fetchSecApi(url);
  }

  async getCompanySubmissionsRaw(cik: string) {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    return this.fetchSecApi(url);
  }
}

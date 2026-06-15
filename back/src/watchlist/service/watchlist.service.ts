import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WatchlistRepository } from '../repository/watchlist.repository';
import { CompaniesService } from '../../companies/service/companies.service';

@Injectable()
export class WatchlistService {
  constructor(
    private watchlistRepository: WatchlistRepository,
    private companiesService: CompaniesService,
  ) {}

  async add(userId: number, ticker: string) {
    const upperTicker = ticker.toUpperCase();

    try {
      await this.companiesService.getMetrics(upperTicker);
    } catch {
      throw new NotFoundException('Ticker inválido o no encontrado');
    }

    const existing = await this.watchlistRepository.findByUserAndTicker(
      userId,
      upperTicker,
    );
    if (existing) {
      throw new ConflictException('La empresa ya está en la watchlist');
    }

    return this.watchlistRepository.create(userId, upperTicker);
  }

  async remove(userId: number, ticker: string) {
    const upperTicker = ticker.toUpperCase();
    const existing = await this.watchlistRepository.findByUserAndTicker(
      userId,
      upperTicker,
    );
    if (!existing) {
      throw new NotFoundException('La empresa no está en tu watchlist');
    }
    return this.watchlistRepository.delete(userId, upperTicker);
  }

  async getList(userId: number) {
    return this.watchlistRepository.findListWithPrices(userId);
  }

  async compare(userId: number, tickers: string[]) {
    const userItems = await this.watchlistRepository.findListWithPrices(userId);
    const validTickers = userItems.map((i) => i.ticker);

    const toCompare = tickers.filter((t) =>
      validTickers.includes(t.toUpperCase()),
    );

    const results: any[] = [];

    for (const t of toCompare) {
      try {
        const metrics = await this.companiesService.getMetrics(t);
        results.push({ ticker: t, ...metrics });
      } catch {
        console.warn(`No se pudieron obtener métricas para ${t}`);
      }
    }
    return results;
  }
}

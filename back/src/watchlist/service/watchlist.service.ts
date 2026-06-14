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
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WatchlistRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, ticker: string) {
    return this.prisma.watchlistItem.create({
      data: { userId, ticker: ticker.toUpperCase() },
    });
  }

  async findByUserAndTicker(userId: number, ticker: string) {
    return this.prisma.watchlistItem.findUnique({
      where: {
        userId_ticker: { userId, ticker: ticker.toUpperCase() },
      },
    });
  }

  async delete(userId: number, ticker: string) {
    return this.prisma.watchlistItem.delete({
      where: {
        userId_ticker: { userId, ticker: ticker.toUpperCase() },
      },
    });
  }

  async findListWithPrices(userId: number) {
    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
    });

    const tickers = items.map((i) => i.ticker);

    const prices = await this.prisma.stockPrice.findMany({
      where: { ticker: { in: tickers } },
    });

    return items.map((item) => {
      const priceData = prices.find((p) => p.ticker === item.ticker);
      return {
        ticker: item.ticker,
        price: priceData?.price || null,
        updatedAt: priceData?.updatedAt || null,
      };
    });
  }
}

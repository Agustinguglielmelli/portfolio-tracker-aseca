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
}

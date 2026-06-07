import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateTransactionInput {
  userId: number;
  ticker: string;
  type: TransactionType;
  quantity: number;
  priceAtOp: number;
  date: Date;
}

@Injectable()
export class PortfolioRepository {
  constructor(private prisma: PrismaService) {}

  getTransactionsByUserAndTicker(userId: number, ticker: string) {
    return this.prisma.portfolioTransaction.findMany({
      where: { userId, ticker },
    });
  }

  getAllTransactionsByUser(userId: number) {
    return this.prisma.portfolioTransaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  createTransaction(data: CreateTransactionInput) {
    return this.prisma.portfolioTransaction.create({ data });
  }

  findTransactionById(id: number) {
    return this.prisma.portfolioTransaction.findUnique({ where: { id } });
  }

  deleteTransaction(id: number) {
    return this.prisma.portfolioTransaction.delete({ where: { id } });
  }

  getStockPrice(ticker: string) {
    return this.prisma.stockPrice.findUnique({ where: { ticker } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePortfolioItemInput {
  userId: number;
  ticker: string;
  quantity: number;
  operationDate: Date;
}

@Injectable()
export class PortfolioRepository {
  constructor(private prisma: PrismaService) {}

  async createPortfolioItem(data: CreatePortfolioItemInput) {
    return this.prisma.portfolioItem.create({ data });
  }
}

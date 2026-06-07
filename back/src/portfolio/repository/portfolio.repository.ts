import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfolioRepository {
  constructor(private prisma: PrismaService) {}
}

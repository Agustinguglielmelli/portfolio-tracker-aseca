import { BadRequestException, Injectable } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repository';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async createPortfolioItem(userId: number, body: CreatePortfolioItemDto) {
    const ticker = typeof body.ticker === 'string' ? body.ticker.trim() : '';
    if (!ticker) {
      throw new BadRequestException('El ticker no puede estar vacío');
    }

    if (
      typeof body.quantity !== 'number' ||
      Number.isNaN(body.quantity) ||
      body.quantity <= 0
    ) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    if (!body.operationDate) {
      throw new BadRequestException('La fecha de operación es requerida');
    }

    const operationDate = new Date(body.operationDate);
    if (Number.isNaN(operationDate.getTime())) {
      throw new BadRequestException('Fecha de operación inválida');
    }

    return this.portfolioRepository.createPortfolioItem({
      userId,
      ticker: ticker.toUpperCase(),
      quantity: body.quantity,
      operationDate,
    });
  }
}

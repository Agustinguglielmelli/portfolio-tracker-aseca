import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PortfolioTransaction, TransactionType } from '@prisma/client';
import { PortfolioRepository } from '../repository/portfolio.repository';
import { applyFifo, getTotalCost, getTotalShares } from '../utils/helpers';
import { PortfolioPosition } from '../utils/types';
import { BuyDto } from '../dto/buy.dto';
import { SellDto } from '../dto/sell.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async buy(userId: number, dto: BuyDto): Promise<PortfolioTransaction> {
    const price = await this.getStockPriceOrThrow(dto.ticker);

    if (dto.quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    return this.portfolioRepository.createTransaction({
      userId,
      ticker: dto.ticker,
      type: TransactionType.BUY,
      quantity: dto.quantity,
      priceAtOp: price,
      date: new Date(dto.date),
    });
  }

  async sell(userId: number, dto: SellDto): Promise<PortfolioTransaction> {
    const price = await this.getStockPriceOrThrow(dto.ticker);

    const transactions =
      await this.portfolioRepository.getTransactionsByUserAndTicker(
        userId,
        dto.ticker,
      );

    const lots = applyFifo(transactions);
    const totalShares = getTotalShares(lots);

    if (totalShares === 0) {
      throw new BadRequestException(`No tenés posición en ${dto.ticker}`);
    }

    if (dto.quantity > totalShares) {
      throw new BadRequestException(
        `No tenés suficientes acciones. Disponibles: ${totalShares}`,
      );
    }

    return this.portfolioRepository.createTransaction({
      userId,
      ticker: dto.ticker,
      type: TransactionType.SELL,
      quantity: dto.quantity,
      priceAtOp: price,
      date: new Date(dto.date),
    });
  }

  async getPortfolio(userId: number): Promise<PortfolioPosition[]> {
    const transactions =
      await this.portfolioRepository.getAllTransactionsByUser(userId);

    if (transactions.length === 0) return [];

    const byTicker = this.groupTransactionsByTicker(transactions);

    const positions = await Promise.all(
      Array.from(byTicker.entries()).map(([ticker, txs]) =>
        this.buildPosition(ticker, txs),
      ),
    );

    return positions.filter((p): p is PortfolioPosition => p !== null);
  }
  async deleteTransaction(
    userId: number,
    transactionId: number,
  ): Promise<void> {
    const tx = await this.findTransactionOrThrow(transactionId);
    this.validateOwnership(tx, userId);

    if (tx.type === TransactionType.BUY) {
      await this.validateFifoAfterBuyRemoval(
        // no puedo borrar un buy y dejar su sell porque es inconsistente
        userId,
        tx.ticker,
        transactionId,
      );
    }

    await this.portfolioRepository.deleteTransaction(transactionId);
  }

  private async findTransactionOrThrow(
    transactionId: number,
  ): Promise<PortfolioTransaction> {
    const tx =
      await this.portfolioRepository.findTransactionById(transactionId);
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    return tx;
  }

  private validateOwnership(tx: PortfolioTransaction, userId: number): void {
    if (tx.userId !== userId)
      throw new ForbiddenException(
        'No tenés permiso para eliminar esta transacción',
      );
  }

  private async validateFifoAfterBuyRemoval(
    userId: number,
    ticker: string,
    transactionId: number,
  ): Promise<void> {
    const allTxs =
      await this.portfolioRepository.getTransactionsByUserAndTicker(
        userId,
        ticker,
      );
    const withoutThis = allTxs.filter((t) => t.id !== transactionId);
    const remainingShares = getTotalShares(applyFifo(withoutThis));
    const totalSold = withoutThis
      .filter((t) => t.type === TransactionType.SELL)
      .reduce((sum, t) => sum + t.quantity, 0);

    if (totalSold > remainingShares) {
      throw new BadRequestException(
        'No podés eliminar esta compra porque dejaría ventas sin respaldo',
      );
    }
  }

  async getAllTransactions(userId: number): Promise<PortfolioTransaction[]> {
    return this.portfolioRepository.getAllTransactionsByUser(userId);
  }

  private async getStockPriceOrThrow(ticker: string): Promise<number> {
    const stockPrice = await this.portfolioRepository.getStockPrice(ticker);
    if (!stockPrice) {
      throw new NotFoundException(
        `No hay precio registrado para el ticker ${ticker}`,
      );
    }
    return stockPrice.price;
  }

  private groupTransactionsByTicker(
    transactions: PortfolioTransaction[],
  ): Map<string, PortfolioTransaction[]> {
    const byTicker = new Map<string, PortfolioTransaction[]>();
    for (const tx of transactions) {
      if (!byTicker.has(tx.ticker)) byTicker.set(tx.ticker, []);
      byTicker.get(tx.ticker)!.push(tx);
    }
    return byTicker;
  }

  private async buildPosition(
    ticker: string,
    transactions: PortfolioTransaction[],
  ): Promise<PortfolioPosition | null> {
    const lots = applyFifo(transactions);
    if (lots.length === 0) return null;

    const totalShares = getTotalShares(lots);
    const totalCost = getTotalCost(lots);
    const avgCost = totalCost / totalShares;

    const stockPrice = await this.portfolioRepository.getStockPrice(ticker);
    if (!stockPrice) {
      return {
        ticker,
        totalShares,
        avgCost,
        totalCost,
        currentPrice: null,
        currentValue: null,
        pnl: null,
        pnlPct: null,
      };
    }

    const currentPrice = stockPrice.price;
    const currentValue = totalShares * currentPrice;
    const pnl = currentValue - totalCost;
    const pnlPct = (pnl / totalCost) * 100;

    return {
      ticker,
      totalShares,
      avgCost,
      totalCost,
      currentPrice,
      currentValue,
      pnl,
      pnlPct,
    };
  }
}

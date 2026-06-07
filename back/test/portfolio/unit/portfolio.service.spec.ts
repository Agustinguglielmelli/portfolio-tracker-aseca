import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PortfolioService } from '../../../src/portfolio/service/portfolio.service';
import { PortfolioRepository } from '../../../src/portfolio/repository/portfolio.repository';

const mockRepo = {
  getTransactionsByUserAndTicker: jest.fn(),
  getAllTransactionsByUser: jest.fn(),
  createTransaction: jest.fn(),
  findTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  getStockPrice: jest.fn(),
};

const makeTx = (
  id: number,
  type: TransactionType,
  quantity: number,
  priceAtOp: number,
  date: string,
  ticker = 'AAPL',
  userId = 1,
) => ({
  id,
  userId,
  ticker,
  type,
  quantity,
  priceAtOp,
  date: new Date(date),
  createdAt: new Date(date),
});

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PortfolioRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => jest.clearAllMocks());

  // Buy trasnsactions

  describe('buy', () => {
    it('lanza NotFoundException si el ticker no tiene precio registrado', async () => {
      mockRepo.getStockPrice.mockResolvedValue(null);

      await expect(
        service.buy(1, { ticker: 'AAPL', quantity: 10, date: '2026-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si la cantidad es 0 o negativa', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });

      await expect(
        service.buy(1, { ticker: 'AAPL', quantity: 0, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea la transacción con el precio del sistema', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });

      await service.buy(1, {
        ticker: 'AAPL',
        quantity: 10,
        date: '2026-01-01',
      });

      expect(mockRepo.createTransaction).toHaveBeenCalledWith({
        userId: 1,
        ticker: 'AAPL',
        type: TransactionType.BUY,
        quantity: 10,
        priceAtOp: 150,
        date: new Date('2026-01-01'),
      });
    });
  });

  // Sell transactions

  describe('sell', () => {
    it('lanza NotFoundException si el ticker no tiene precio registrado', async () => {
      mockRepo.getStockPrice.mockResolvedValue(null);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 5, date: '2026-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si no hay posicion en ese ticker', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([]);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 5, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si quiere vender más de lo disponible', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 5, 100, '2026-01-01'),
      ]);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 10, date: '2026-02-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea la transacción de venta con el precio del sistema', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 180 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
      ]);

      await service.sell(1, {
        ticker: 'AAPL',
        quantity: 5,
        date: '2026-02-01',
      });

      expect(mockRepo.createTransaction).toHaveBeenCalledWith({
        userId: 1,
        ticker: 'AAPL',
        type: TransactionType.SELL,
        quantity: 5,
        priceAtOp: 180,
        date: new Date('2026-02-01'),
      });
    });
  });

  describe('getPortfolio', () => {
    it('retorna array vacío si no hay transacciones', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([]);

      const result = await service.getPortfolio(1);

      expect(result).toEqual([]);
    });

    it('calcula correctamente totalShares, avgCost, totalCost y pnl', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.BUY, 10, 200, '2026-02-01'),
      ]);
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 175 });

      const result = await service.getPortfolio(1);

      expect(result).toEqual([
        {
          ticker: 'AAPL',
          totalShares: 20,
          avgCost: 150,
          totalCost: 3000,
          currentPrice: 175,
          currentValue: 3500,
          pnl: 500,
          pnlPct: expect.closeTo(16.67, 1),
        },
      ]);
    });

    it('no muestra tickers con posición que quedó en cero', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.SELL, 10, 150, '2026-02-01'),
      ]);

      const result = await service.getPortfolio(1);

      expect(result).toEqual([]);
    });

    it('retorna currentPrice null y pnl null si el ticker no tiene precio', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
      ]);
      mockRepo.getStockPrice.mockResolvedValue(null);

      const result = await service.getPortfolio(1);

      expect(result[0].currentPrice).toBeNull();
      expect(result[0].pnl).toBeNull();
      expect(result[0].pnlPct).toBeNull();
    });
  });

  describe('getAllTransactions', () => {
    it('devuelve todas las transacciones del usuario', async () => {
      const txs = [
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.SELL, 5, 150, '2026-02-01'),
      ];
      mockRepo.getAllTransactionsByUser.mockResolvedValue(txs);

      const result = await service.getAllTransactions(1);

      expect(result).toEqual(txs);
    });

    it('devuelve array vacío si no hay transacciones', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([]);

      const result = await service.getAllTransactions(1);

      expect(result).toEqual([]);
    });
  });
});

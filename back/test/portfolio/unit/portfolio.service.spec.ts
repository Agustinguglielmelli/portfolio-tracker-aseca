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

  describe('buy', () => {
    it('throws BadRequestException if ticker is missing', async () => {
      await expect(
        service.buy(1, { ticker: '', quantity: 10, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if the ticker has no registered price', async () => {
      mockRepo.getStockPrice.mockResolvedValue(null);

      await expect(
        service.buy(1, { ticker: 'AAPL', quantity: 10, date: '2026-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if quantity is 0', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });

      await expect(
        service.buy(1, { ticker: 'AAPL', quantity: 0, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if quantity is negative', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });

      await expect(
        service.buy(1, { ticker: 'AAPL', quantity: -10, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the transaction with the system price', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });
      const expectedTx = makeTx(1, TransactionType.BUY, 10, 150, '2026-01-01');
      mockRepo.createTransaction.mockResolvedValue(expectedTx);

      const result = await service.buy(1, {
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
      expect(result).toEqual(expectedTx);
    });
  });

  describe('sell', () => {
    it('throws BadRequestException if ticker is missing', async () => {
      await expect(
        service.sell(1, { ticker: '', quantity: 5, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if the ticker has no registered price', async () => {
      mockRepo.getStockPrice.mockResolvedValue(null);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 5, date: '2026-01-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if there is no position in the ticker', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([]);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 5, date: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if selling more than available', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 5, 100, '2026-01-01'),
      ]);

      await expect(
        service.sell(1, { ticker: 'AAPL', quantity: 10, date: '2026-02-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the sell transaction with the system price', async () => {
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 180 });
      mockRepo.getTransactionsByUserAndTicker.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
      ]);
      const expectedTx = makeTx(2, TransactionType.SELL, 5, 180, '2026-02-01');
      mockRepo.createTransaction.mockResolvedValue(expectedTx);

      const result = await service.sell(1, {
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
      expect(result).toEqual(expectedTx);
    });
  });

  describe('getPortfolio', () => {
    it('returns empty array if there are no transactions', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([]);

      const result = await service.getPortfolio(1);

      expect(result).toEqual([]);
    });

    it('correctly calculates totalShares, avgCost, totalCost and pnl', async () => {
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

    it('correctly calculates remaining shares after a partial sell', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.SELL, 4, 150, '2026-02-01'),
      ]);
      mockRepo.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 175 });

      const result = await service.getPortfolio(1);

      expect(result).toEqual([
        {
          ticker: 'AAPL',
          totalShares: 6,
          avgCost: 100,
          totalCost: 600,
          currentPrice: 175,
          currentValue: 1050,
          pnl: 450,
          pnlPct: 75,
        },
      ]);
    });

    it('does not show tickers with a position that reached zero', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.SELL, 10, 150, '2026-02-01'),
      ]);

      const result = await service.getPortfolio(1);

      expect(result).toEqual([]);
    });

    it('returns null currentPrice and pnl if the ticker has no price', async () => {
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
    it('returns all user transactions', async () => {
      const txs = [
        makeTx(1, TransactionType.BUY, 10, 100, '2026-01-01'),
        makeTx(2, TransactionType.SELL, 5, 150, '2026-02-01'),
      ];
      mockRepo.getAllTransactionsByUser.mockResolvedValue(txs);

      const result = await service.getAllTransactions(1);

      expect(result).toEqual(txs);
    });

    it('returns empty array if there are no transactions', async () => {
      mockRepo.getAllTransactionsByUser.mockResolvedValue([]);

      const result = await service.getAllTransactions(1);

      expect(result).toEqual([]);
    });
  });
});

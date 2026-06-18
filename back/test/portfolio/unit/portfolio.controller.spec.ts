import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from '../../../src/portfolio/portfolio.controller';
import { PortfolioService } from '../../../src/portfolio/service/portfolio.service';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { BuyDto } from '../../../src/portfolio/dto/buy.dto';
import { SellDto } from '../../../src/portfolio/dto/sell.dto';

import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let service: PortfolioService;

  const mockService = {
    buy: jest.fn(),
    sell: jest.fn(),
    getPortfolio: jest.fn(),
    getAllTransactions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [{ provide: PortfolioService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PortfolioController>(PortfolioController);
    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (userId?: number): Request => {
    return {
      user: userId ? { sub: userId } : undefined,
    } as unknown as Request;
  };

  describe('getUserId', () => {
    it('throws UnauthorizedException if user or sub is missing', async () => {
      const req = mockRequest();
      const dto: BuyDto = { ticker: 'AAPL', quantity: 10, date: '2026-01-01' };

      await expect(controller.buy(dto, req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('buy', () => {
    it('calls service.buy with userId and dto', async () => {
      const dto: BuyDto = { ticker: 'AAPL', quantity: 10, date: '2026-01-01' };
      const req = mockRequest(1);
      const expectedResult = { id: 1, ...dto };
      mockService.buy.mockResolvedValue(expectedResult);

      const result = await controller.buy(dto, req);

      expect(mockService.buy).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('sell', () => {
    it('calls service.sell with userId and dto', async () => {
      const dto: SellDto = { ticker: 'AAPL', quantity: 5, date: '2026-01-01' };
      const req = mockRequest(1);
      const expectedResult = { id: 2, ...dto };
      mockService.sell.mockResolvedValue(expectedResult);

      const result = await controller.sell(dto, req);

      expect(mockService.sell).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getPortfolio', () => {
    it('calls service.getPortfolio with userId', async () => {
      const req = mockRequest(1);
      const expectedResult = [{ ticker: 'AAPL', totalShares: 10 }];
      mockService.getPortfolio.mockResolvedValue(expectedResult);

      const result = await controller.getPortfolio(req);

      expect(mockService.getPortfolio).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllTransactions', () => {
    it('calls service.getAllTransactions with userId', async () => {
      const req = mockRequest(1);
      const expectedResult = [{ id: 1, ticker: 'AAPL' }];
      mockService.getAllTransactions.mockResolvedValue(expectedResult);

      const result = await controller.getAllTransactions(req);

      expect(mockService.getAllTransactions).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });
});

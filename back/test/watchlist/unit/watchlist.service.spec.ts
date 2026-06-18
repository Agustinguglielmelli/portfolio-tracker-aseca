import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from '../../../src/watchlist/service/watchlist.service';
import { WatchlistRepository } from '../../../src/watchlist/repository/watchlist.repository';
import { CompaniesService } from '../../../src/companies/service/companies.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let repo: WatchlistRepository;
  let companiesService: CompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchlistRepository,
          useValue: {
            create: jest.fn(),
            findByUserAndTicker: jest.fn(),
            delete: jest.fn(),
            findListWithPrices: jest.fn(),
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            getMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    repo = module.get<WatchlistRepository>(WatchlistRepository);
    companiesService = module.get<CompaniesService>(CompaniesService);
  });

  describe('add', () => {
    it('should add a ticker to the watchlist', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({} as any);
      jest.spyOn(repo, 'findByUserAndTicker').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(repo, 'create')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });

      const result = await service.add(1, 'aapl');
      expect(result.ticker).toBe('AAPL');
      expect(createSpy).toHaveBeenCalledWith(1, 'AAPL');
    });

    it('should throw NotFoundException if ticker metrics are not found', async () => {
      jest
        .spyOn(companiesService, 'getMetrics')
        .mockRejectedValue(new Error('Not found'));
      await expect(service.add(1, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if ticker is already in the watchlist', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({} as any);
      jest
        .spyOn(repo, 'findByUserAndTicker')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });
      await expect(service.add(1, 'AAPL')).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a ticker from the watchlist', async () => {
      jest
        .spyOn(repo, 'findByUserAndTicker')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });
      const deleteSpy = jest
        .spyOn(repo, 'delete')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });

      const result = await service.remove(1, 'AAPL');
      expect(result.ticker).toBe('AAPL');
      expect(deleteSpy).toHaveBeenCalledWith(1, 'AAPL');
    });

    it('should throw NotFoundException if ticker is not in the watchlist', async () => {
      jest.spyOn(repo, 'findByUserAndTicker').mockResolvedValue(null);
      await expect(service.remove(1, 'AAPL')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getList', () => {
    it('should return the list of companies with their prices', async () => {
      const mockData = [{ ticker: 'AAPL', price: 150, updatedAt: new Date() }];
      const findSpy = jest
        .spyOn(repo, 'findListWithPrices')
        .mockResolvedValue(mockData);

      const result = await service.getList(1);
      expect(result).toEqual(mockData);
      expect(findSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('compare', () => {
    it('should return metrics for multiple companies', async () => {
      jest.spyOn(repo, 'findListWithPrices').mockResolvedValue([
        { ticker: 'AAPL', price: 150, updatedAt: new Date() },
        { ticker: 'MSFT', price: 300, updatedAt: new Date() },
      ]);
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({
        revenue: 1000,
        netIncome: 500,
        eps: 5,
        totalAssets: 2000,
        totalLiabilities: 1000,
      });

      const result = await service.compare(1, ['AAPL', 'MSFT']);
      expect(result.length).toBe(2);
      expect(result[0].ticker).toBe('AAPL');
      expect(result[0].revenue).toBe(1000);
      expect(result[1].ticker).toBe('MSFT');
      expect(result[1].revenue).toBe(1000);
    });

    it('should filter out tickers not in the users watchlist', async () => {
      jest
        .spyOn(repo, 'findListWithPrices')
        .mockResolvedValue([
          { ticker: 'AAPL', price: 150, updatedAt: new Date() },
        ]);
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({
        revenue: 1000,
      } as any);

      const result = await service.compare(1, ['AAPL', 'MSFT']);
      expect(result.length).toBe(1);
      expect(result[0].ticker).toBe('AAPL');
    });

    it('should skip tickers that fail to retrieve metrics', async () => {
      jest.spyOn(repo, 'findListWithPrices').mockResolvedValue([
        { ticker: 'AAPL', price: 150, updatedAt: new Date() },
        { ticker: 'MSFT', price: 300, updatedAt: new Date() },
      ]);
      jest
        .spyOn(companiesService, 'getMetrics')
        .mockImplementation(async (ticker) => {
          if (ticker === 'MSFT') throw new Error('Not found');
          return { revenue: 1000 } as any;
        });

      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await service.compare(1, ['AAPL', 'MSFT']);
      expect(result.length).toBe(1);
      expect(result[0].ticker).toBe('AAPL');
      expect(consoleSpy).toHaveBeenCalledWith(
        'No se pudieron obtener métricas para MSFT',
      );
    });
  });
});

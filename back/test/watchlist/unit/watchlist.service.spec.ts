import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from '../../../src/watchlist/service/watchlist.service';
import { WatchlistRepository } from '../../../src/watchlist/repository/watchlist.repository';
import { CompaniesService } from '../../../src/companies/service/companies.service';

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
    it('debe agregar un ticker a la watchlist', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({} as any);
      jest.spyOn(repo, 'findByUserAndTicker').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(repo, 'create')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });

      const result = await service.add(1, 'aapl');
      expect(result.ticker).toBe('AAPL');
      expect(createSpy).toHaveBeenCalledWith(1, 'AAPL');
    });
  });

  describe('remove', () => {
    it('debe eliminar un ticker de la watchlist', async () => {
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
  });

  describe('getList', () => {
    it('debe retornar la lista de empresas con sus precios', async () => {
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
    it('debe retornar metricas de multiples empresas', async () => {
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
    });
  });
});

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
    it('debe agregar un ticker a la watchlist', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({} as any);
      jest.spyOn(repo, 'findByUserAndTicker').mockResolvedValue(null);
      jest
        .spyOn(repo, 'create')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });

      const result = await service.add(1, 'aapl');
      expect(result.ticker).toBe('AAPL');
      expect(repo.create).toHaveBeenCalledWith(1, 'AAPL');
    });

    it('debe arrojar NotFoundException si el ticker no existe', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockRejectedValue(new Error());
      await expect(service.add(1, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe arrojar ConflictException si ya esta en la watchlist', async () => {
      jest.spyOn(companiesService, 'getMetrics').mockResolvedValue({} as any);
      jest
        .spyOn(repo, 'findByUserAndTicker')
        .mockResolvedValue({ id: 1, userId: 1, ticker: 'AAPL' });
      await expect(service.add(1, 'AAPL')).rejects.toThrow(ConflictException);
    });
  });
});

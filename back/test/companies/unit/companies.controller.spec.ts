import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from '../../../src/companies/companies.controller';
import { CompaniesService } from '../../../src/companies/service/companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const mockCompaniesService = {
    searchCompanies: jest.fn(),
    getMetrics: jest.fn(),
    getFilings: jest.fn(),
    getHistoricalMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should return an empty array if query is falsy', async () => {
      const result = await controller.search('');
      expect(result).toEqual([]);
      expect(mockCompaniesService.searchCompanies).not.toHaveBeenCalled();
    });

    it('should call service.searchCompanies if query is provided', async () => {
      const expectedResult = [{ ticker: 'AAPL', name: 'Apple Inc' }];
      mockCompaniesService.searchCompanies.mockResolvedValue(expectedResult);

      const result = await controller.search('AAPL');

      expect(mockCompaniesService.searchCompanies).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMetrics', () => {
    it('should call service.getMetrics with the provided ticker', async () => {
      const expectedResult = { revenue: 1000, netIncome: 500 };
      mockCompaniesService.getMetrics.mockResolvedValue(expectedResult);

      const result = await controller.getMetrics('AAPL');

      expect(mockCompaniesService.getMetrics).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getFilings', () => {
    it('should call service.getFilings with the provided ticker', async () => {
      const expectedResult = [{ type: '10-K', date: '2024-01-01' }];
      mockCompaniesService.getFilings.mockResolvedValue(expectedResult);

      const result = await controller.getFilings('MSFT');

      expect(mockCompaniesService.getFilings).toHaveBeenCalledWith('MSFT');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getHistoricalMetrics', () => {
    it('should call service.getHistoricalMetrics with the provided ticker', async () => {
      const expectedResult = { revenue: [{ value: 100, date: '2024' }] };
      mockCompaniesService.getHistoricalMetrics.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getHistoricalMetrics('GOOG');

      expect(mockCompaniesService.getHistoricalMetrics).toHaveBeenCalledWith(
        'GOOG',
      );
      expect(result).toEqual(expectedResult);
    });
  });
});

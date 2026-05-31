import { Test } from '@nestjs/testing';
import { CompaniesService } from '../../../src/companies/service/companies.service';
import { CompaniesRepository } from '../../../src/companies/repository/companies.repository';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const repoMock = {
    searchCompaniesRaw: jest.fn(),
    getCompanyFactsRaw: jest.fn(),
    getCompanySubmissionsRaw: jest.fn(),
    getCikByTicker: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: CompaniesRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get(CompaniesService);
    jest.clearAllMocks();
  });
  it('should return empty array when no hits', async () => {
    repoMock.searchCompaniesRaw.mockResolvedValue({});

    const result = await service.searchCompanies('x');

    expect(result).toEqual([]);
  });

  it('should return mapped and unique companies', async () => {
    repoMock.searchCompaniesRaw.mockResolvedValue({
      hits: {
        hits: [
          {
            _source: {
              display_names: ['Apple Inc (AAPL) (CIK 0001)'],
              ciks: ['0001'],
            },
          },
        ],
      },
    });

    const result = await service.searchCompanies('apple');

    expect(result).toEqual([
      {
        name: 'Apple Inc',
        ticker: 'AAPL',
        cik: '0001',
      },
    ]);
  });

  it('should return financial metrics', async () => {
    repoMock.getCikByTicker.mockReturnValue('0001');

    repoMock.getCompanyFactsRaw.mockResolvedValue({
      facts: {
        'us-gaap': {
          Revenues: {
            units: {
              USD: [
                {
                  val: 100,
                  end: '2024-01-01',
                  frame: 'CY2024',
                },
              ],
            },
          },
          NetIncomeLoss: {
            units: {
              USD: [
                {
                  val: 50,
                  end: '2024-01-01',
                  frame: 'CY2024',
                },
              ],
            },
          },
        },
      },
    });

    const result = await service.getMetrics('AAPL');

    expect(result.revenue).toBeDefined();
    expect(result.netIncome).toBeDefined();
  });

  it('should throw NotFoundException if no GAAP data', async () => {
    repoMock.getCikByTicker.mockReturnValue('0001');

    repoMock.getCompanyFactsRaw.mockResolvedValue({
      facts: {},
    });

    await expect(service.getMetrics('AAPL')).rejects.toThrow();
  });

  it('should return empty array if no filings', async () => {
    repoMock.getCikByTicker.mockReturnValue('0001');
    repoMock.getCompanySubmissionsRaw.mockResolvedValue({});

    const result = await service.getFilings('AAPL');

    expect(result).toEqual([]);
  });

  it('should return only 10-K and 10-Q filings sorted', async () => {
    repoMock.getCikByTicker.mockReturnValue('0001');

    repoMock.getCompanySubmissionsRaw.mockResolvedValue({
      filings: {
        recent: {
          form: ['8-K', '10-K', '10-Q'],
          filingDate: ['2023-01-01', '2024-01-01', '2023-06-01'],
          accessionNumber: ['1', '2', '3'],
        },
      },
    });

    const result = await service.getFilings('AAPL');

    expect(result.map((r) => r.type)).toEqual(['10-K', '10-Q']);
  });

  it('should return historical metrics', async () => {
    repoMock.getCikByTicker.mockReturnValue('0001');

    repoMock.getCompanyFactsRaw.mockResolvedValue({
      facts: {
        'us-gaap': {
          Revenues: {
            units: {
              USD: [
                {
                  val: 100,
                  end: '2024-01-01',
                  form: '10-K',
                },
              ],
            },
          },
        },
      },
    });

    const result = await service.getHistoricalMetrics('AAPL');

    expect(result.revenue).toBeDefined();
  });
});

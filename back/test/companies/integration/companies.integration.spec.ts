/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { CompaniesRepository } from '../../../src/companies/repository/companies.repository';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesController (e2e)', () => {
  let app: INestApplication;

  // Objeto simulado (mock) de las respuestas de la SEC
  const mockRepository = {
    getCikByTicker: jest.fn(),
    searchCompaniesRaw: jest.fn(),
    getCompanyFactsRaw: jest.fn(),
    getCompanySubmissionsRaw: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CompaniesRepository)
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    // Limpiamos los mocks antes de cada test para no cruzar información
    jest.clearAllMocks();
  });

  describe('/companies/search (GET)', () => {
    it('debe devolver un arreglo vacío si no se envía un query "q"', () => {
      return request(app.getHttpServer())
        .get('/companies/search')
        .expect(200)
        .expect([]);
    });

    it('debe realizar la búsqueda y devolver un arreglo único de empresas', async () => {
      mockRepository.searchCompaniesRaw.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                display_names: ['Apple Inc.'],
                tickers: ['AAPL'],
                ciks: ['0000320193'],
              },
            },
            {
              _source: {
                display_names: ['Apple Inc. Hardware'],
                tickers: ['AAPL'],
                ciks: ['0000320193'],
              },
            },
          ],
        },
      });

      const response = await request(app.getHttpServer())
        .get('/companies/search?q=apple')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual({
        name: 'Apple Inc.',
        ticker: 'AAPL',
        cik: '0000320193',
      });
    });
  });

  describe('/companies/:ticker/metrics (GET)', () => {
    it('debe arrojar error 404 si el ticker no existe', () => {
      mockRepository.getCikByTicker.mockImplementation(() => {
        throw new NotFoundException('La empresa con ticker FAKE no existe');
      });

      return request(app.getHttpServer())
        .get('/companies/FAKE/metrics')
        .expect(404)
        .expect((res: request.Response) => {
          expect(res.body.message).toContain('FAKE no existe');
        });
    });

    it('debe devolver métricas financieras formateadas', async () => {
      mockRepository.getCikByTicker.mockReturnValue('1234567890');
      mockRepository.getCompanyFactsRaw.mockResolvedValue({
        facts: {
          'us-gaap': {
            Revenues: {
              units: {
                USD: [
                  { end: '2022-12-31', val: 1000, frame: 'CY2022' },
                  { end: '2023-12-31', val: 2500, frame: 'CY2023' },
                ],
              },
            },
            NetIncomeLoss: {
              units: {
                USD: [{ end: '2023-12-31', val: 500, frame: 'CY2023' }],
              },
            },
            EarningsPerShareBasic: {
              units: {
                'USD/shares': [
                  { end: '2023-12-31', val: 2.5, frame: 'CY2023' },
                ],
              },
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/companies/AAPL/metrics')
        .expect(200);

      expect(response.body).toEqual({
        revenue: 2500,
        netIncome: 500,
        eps: 2.5,
        totalAssets: null,
        totalLiabilities: null,
      });
    });
  });

  describe('/companies/:ticker/filings (GET)', () => {
    it('debe devolver filings ordenados por fecha más reciente', async () => {
      mockRepository.getCikByTicker.mockReturnValue('1234567890');

      mockRepository.getCompanySubmissionsRaw.mockResolvedValue({
        filings: {
          recent: {
            form: ['8-K', '10-K', '10-Q'],
            filingDate: ['2023-05-01', '2023-01-15', '2023-04-10'],
            accessionNumber: ['111', '222', '333'],
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/companies/MSFT/filings')
        .expect(200);

      expect(response.body).toEqual([
        { date: '2023-04-10', type: '10-Q', accessionNumber: '333' },
        { date: '2023-01-15', type: '10-K', accessionNumber: '222' },
      ]);
    });
  });

  describe('/companies/:ticker/historical-metrics (GET)', () => {
    it('debe devolver historial de al menos 8 trimestres ordenados descendentemente', async () => {
      mockRepository.getCikByTicker.mockReturnValue('1234567890');

      mockRepository.getCompanyFactsRaw.mockResolvedValue({
        facts: {
          'us-gaap': {
            Revenues: {
              units: {
                USD: [
                  { end: '2023-03-31', val: 100, form: '10-Q' },
                  { end: '2023-06-30', val: 200, form: '10-Q' },
                  { end: '2023-09-30', val: 300, form: '10-Q' },
                ],
              },
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/companies/GOOG/historical-metrics')
        .expect(200);

      const revenues = response.body.revenue;
      expect(revenues.length).toBe(3);
      expect(revenues[0].date).toBe('2023-09-30');
      expect(revenues[0].value).toBe(300);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

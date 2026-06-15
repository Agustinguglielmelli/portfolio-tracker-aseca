/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

jest.setTimeout(60000);

describe('Companies Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('/companies/search (GET) - Debe devolver resultados reales de la SEC', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/search?q=microsoft')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    const first = response.body[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('ticker');
    expect(first).toHaveProperty('cik');
    const msft = response.body.find((c: any) => c.ticker === 'MSFT');
    expect(msft).toBeDefined();
  });

  it('/companies/:ticker/metrics (GET) - Debe devolver las métricas reales de AAPL', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/AAPL/metrics')
      .expect(200);
    expect(response.body).toHaveProperty('revenue');
    expect(typeof response.body.revenue).toBe('number');

    expect(response.body).toHaveProperty('netIncome');
    expect(typeof response.body.netIncome).toBe('number');

    expect(response.body).toHaveProperty('eps');
    expect(typeof response.body.eps).toBe('number');
  });

  it('/companies/:ticker/metrics (GET) - Ticker inexistente debe dar 404 Not Found', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/FAKEINVALID/metrics')
      .expect(404);

    expect(response.body.message).toContain('FAKEINVALID no existe');
  });

  it('/companies/:ticker/filings (GET) - Debe devolver reportes recientes (10-K y 10-Q)', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/MSFT/filings')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const firstFiling = response.body[0];
    expect(firstFiling).toHaveProperty('date');
    expect(firstFiling).toHaveProperty('type');
    expect(firstFiling).toHaveProperty('accessionNumber');
    const invalidTypes = response.body.filter(
      (f: any) => f.type !== '10-K' && f.type !== '10-Q',
    );
    expect(invalidTypes.length).toBe(0);
  });

  it('/companies/:ticker/historical-metrics (GET) - Debe parsear y devolver historial de GOOG', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/GOOG/historical-metrics')
      .expect(200);

    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('netIncome');
    expect(response.body).toHaveProperty('eps');

    expect(Array.isArray(response.body.revenue)).toBe(true);
    expect(response.body.revenue.length).toBeGreaterThan(0);
    const lastRevenue = response.body.revenue[0];
    expect(lastRevenue).toHaveProperty('date');
    expect(lastRevenue).toHaveProperty('value');
    expect(typeof lastRevenue.value).toBe('number');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
});

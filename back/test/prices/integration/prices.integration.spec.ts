import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PricesController Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const apiKey = 'test-admin-api-key';

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = apiKey;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    global.fetch = jest.fn();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    await prisma.batchLog.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'prices_test@example.com' },
    });

    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'prices_test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    token = res.body.access_token;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.batchLog.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'prices_test@example.com' },
    });
    await app.close();
  });

  describe('GET /prices/last-update', () => {
    it('should return empty state if no batch log exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/prices/last-update')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        lastUpdate: null,
        message: 'No hay precios registrados. El batch nunca fue ejecutado.',
        tickersProcessed: 0,
        success: 0,
        errors: 0,
        details: [],
      });
    });

    it('should throw unauthorized without token', async () => {
      await request(app.getHttpServer()).get('/prices/last-update').expect(401);
    });
  });

  describe('POST /prices/update', () => {
    it('should successfully trigger update and create log with valid API key', async () => {
      const mockWorkerResponse = {
        tickersProcessed: 2,
        success: 2,
        errors: 0,
        details: [
          { ticker: 'AAPL', price: 150 },
          { ticker: 'MSFT', price: 300 },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkerResponse),
      });

      const response = await request(app.getHttpServer())
        .post('/prices/update')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Stock price batch update completed.',
        tickersProcessed: 2,
        success: 2,
        errors: 0,
      });

      const lastUpdateResponse = await request(app.getHttpServer())
        .get('/prices/last-update')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(lastUpdateResponse.body).toMatchObject({
        message: 'Última actualización de precios recuperada exitosamente.',
        tickersProcessed: 2,
        success: 2,
        errors: 0,
        details: mockWorkerResponse.details,
      });
      expect(lastUpdateResponse.body.lastUpdate).not.toBeNull();
    });

    it('should throw unauthorized if no API key or admin token is provided', async () => {
      await request(app.getHttpServer()).post('/prices/update').expect(401);
    });

    it('should throw forbidden if user token is provided without admin role', async () => {
      await request(app.getHttpServer())
        .post('/prices/update')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should throw 503 if external worker is unreachable', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await request(app.getHttpServer())
        .post('/prices/update')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(503);
    });
  });
});

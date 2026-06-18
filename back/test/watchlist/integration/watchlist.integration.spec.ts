/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('WatchlistController Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;
  const testEmail = 'watchlist_test@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    await prisma.stockPrice.upsert({
      where: { ticker: 'AAPL' },
      update: { price: 150 },
      create: { ticker: 'AAPL', price: 150 },
    });

    await prisma.stockPrice.upsert({
      where: { ticker: 'MSFT' },
      update: { price: 300 },
      create: { ticker: 'MSFT', price: 300 },
    });
  });

  beforeEach(async () => {
    await prisma.watchlistItem.deleteMany({
      where: { user: { email: testEmail } },
    });

    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email: testEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    token = res.body.access_token;
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    userId = user!.id;
  });

  afterAll(async () => {
    await prisma.watchlistItem.deleteMany({ where: { userId } });
    await prisma.stockPrice.deleteMany({ where: { ticker: 'AAPL' } });
    await prisma.stockPrice.deleteMany({ where: { ticker: 'MSFT' } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /watchlist', () => {
    it('should add a ticker to the watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(201);

      const items = await prisma.watchlistItem.findMany({ where: { userId } });
      expect(items).toHaveLength(1);
      expect(items[0].ticker).toBe('AAPL');
    });

    it('should return 409 if ticker is already in the watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' });

      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(409);
    });

    it('should return 404 if the ticker does not exist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'INVALID_TICKER' })
        .expect(404);
    });
  });

  describe('DELETE /watchlist/:ticker', () => {
    it('should remove a ticker from the watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' });

      await request(app.getHttpServer())
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const items = await prisma.watchlistItem.findMany({ where: { userId } });
      expect(items).toHaveLength(0);
    });

    it('should return 404 if the ticker is not in the watchlist', async () => {
      await request(app.getHttpServer())
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /watchlist', () => {
    it('should return an empty array if there are no tickers', async () => {
      const res = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return the list of tickers in the watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' });

      const res = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].ticker).toBe('AAPL');
    });
  });

  describe('GET /watchlist/compare', () => {
    it('should return empty array if no tickers query is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/watchlist/compare')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should return comparison metrics for valid tickers in watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' });

      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'MSFT' });

      const res = await request(app.getHttpServer())
        .get('/watchlist/compare?tickers=AAPL,MSFT')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].ticker).toBe('AAPL');
      expect(res.body[0]).toHaveProperty('revenue');
      expect(res.body[1].ticker).toBe('MSFT');
      expect(res.body[1]).toHaveProperty('revenue');
    });

    it('should filter out tickers not in the users watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' });

      const res = await request(app.getHttpServer())
        .get('/watchlist/compare?tickers=AAPL,MSFT')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].ticker).toBe('AAPL');
    });
  });
});

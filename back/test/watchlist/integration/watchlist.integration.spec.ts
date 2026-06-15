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
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /watchlist', () => {
    it('agrega un ticker a la watchlist', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL' })
        .expect(201);

      const items = await prisma.watchlistItem.findMany({ where: { userId } });
      expect(items).toHaveLength(1);
      expect(items[0].ticker).toBe('AAPL');
    });

    it('devuelve 409 si ya esta en la watchlist', async () => {
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

    it('devuelve 404 si el ticker no existe', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'INVALID_TICKER' })
        .expect(404);
    });
  });

  describe('DELETE /watchlist/:ticker', () => {
    it('elimina un ticker de la watchlist', async () => {
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

    it('devuelve 404 si el ticker no esta en la watchlist', async () => {
      await request(app.getHttpServer())
        .delete('/watchlist/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /watchlist', () => {
    it('devuelve array vacío si no hay tickers', async () => {
      const res = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('devuelve la lista de tickers', async () => {
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
});

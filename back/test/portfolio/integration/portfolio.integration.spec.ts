/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PortfolioController Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;

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
    // Borrar transacciones primero para no violar la foreign key
    await prisma.portfolioTransaction.deleteMany({
      where: { user: { email: 'portfolio_test@example.com' } },
    });
    await prisma.user.deleteMany({
      where: { email: 'portfolio_test@example.com' },
    });

    const res = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'portfolio_test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    token = res.body.access_token;
    const user = await prisma.user.findUnique({
      where: { email: 'portfolio_test@example.com' },
    });
    userId = user!.id;

    // Restaurar precio en caso de que algún test lo haya modificado
    await prisma.stockPrice.update({
      where: { ticker: 'AAPL' },
      data: { price: 150 },
    });
  });

  afterAll(async () => {
    await prisma.portfolioTransaction.deleteMany({ where: { userId } });
    await prisma.stockPrice.deleteMany({ where: { ticker: 'AAPL' } });
    await prisma.user.deleteMany({
      where: { email: 'portfolio_test@example.com' },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /portfolio/buy', () => {
    it('compra acciones y las guarda en la DB', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' })
        .expect(201);

      const txs = await prisma.portfolioTransaction.findMany({
        where: { userId },
      });
      expect(txs).toHaveLength(1);
      expect(txs[0].ticker).toBe('AAPL');
      expect(txs[0].quantity).toBe(10);
      expect(txs[0].priceAtOp).toBe(150);
    });

    it('devuelve 404 si el ticker no tiene precio registrado', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'TICKER_SIN_PRECIO', quantity: 10, date: '2026-01-01' })
        .expect(404);
    });

    it('devuelve 401 sin token', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' })
        .expect(401);
    });
  });

  describe('POST /portfolio/sell', () => {
    it('vende acciones y persiste la transacción correctamente', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' });

      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2026-02-01' })
        .expect(201);

      const sell = await prisma.portfolioTransaction.findFirst({
        where: { userId, type: 'SELL' },
      });

      expect(sell).toBeDefined();
      expect(sell!.ticker).toBe('AAPL');
      expect(sell!.quantity).toBe(5);
      expect(sell!.priceAtOp).toBe(150);
    });

    it('devuelve 400 si no tiene posición en ese ticker', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2026-01-01' })
        .expect(400);
    });

    it('devuelve 400 si intenta vender más de lo disponible', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2026-01-01' });

      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-02-01' })
        .expect(400);
    });
  });

  describe('GET /portfolio', () => {
    it('devuelve array vacío si no hay transacciones', async () => {
      const res = await request(app.getHttpServer())
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('devuelve posición con P&L calculado correctamente', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' });

      const res = await request(app.getHttpServer())
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        ticker: 'AAPL',
        totalShares: 10,
        avgCost: 150,
        totalCost: 1500,
        currentPrice: 150,
        currentValue: 1500,
        pnl: 0,
        pnlPct: 0,
      });
    });

    it('calcula avgCost y pnl correctamente después de múltiples compras y una venta parcial', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' });

      await prisma.stockPrice.update({
        where: { ticker: 'AAPL' },
        data: { price: 200 },
      });

      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-02-01' });

      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2026-03-01' });

      const res = await request(app.getHttpServer())
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        ticker: 'AAPL',
        totalShares: 15,
        totalCost: 2750,
        avgCost: expect.closeTo(183.33, 1),
        currentPrice: 200,
        currentValue: 3000,
        pnl: 250,
        pnlPct: expect.closeTo(9.09, 1),
      });
    });

    it('no muestra tickers con posición cerrada', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' });

      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-02-01' });

      const res = await request(app.getHttpServer())
        .get('/portfolio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /portfolio/transactions', () => {
    it('devuelve el historial de transacciones del usuario', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 10, date: '2026-01-01' });

      await request(app.getHttpServer())
        .post('/portfolio/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({ ticker: 'AAPL', quantity: 5, date: '2026-02-01' });

      const res = await request(app.getHttpServer())
        .get('/portfolio/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });
});

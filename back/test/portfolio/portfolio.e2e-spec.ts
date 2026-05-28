/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { PortfolioController } from '../../src/portfolio/portfolio.controller';
import { PortfolioService } from '../../src/portfolio/portfolio.service';
import { PortfolioRepository } from '../../src/portfolio/portfolio.repository';

const TEST_SECRET = 'test-secret';

describe('PortfolioController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let portfolioStore: Array<{
    id: number;
    userId: number;
    ticker: string;
    quantity: number;
    operationDate: Date;
  }>;

  const mockPrisma: PrismaService = {
    portfolioItem: {
      create: jest.fn(async ({ data }: { data: any }) => {
        const record = {
          id: portfolioStore.length + 1,
          ...data,
        };
        portfolioStore.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: { where?: { userId?: number } }) => {
        if (!where?.userId) return portfolioStore;
        return portfolioStore.filter((item) => item.userId === where.userId);
      }),
      deleteMany: jest.fn(async () => {
        const count = portfolioStore.length;
        portfolioStore = [];
        return { count };
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as unknown as PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [PortfolioController],
      providers: [
        PortfolioService,
        PortfolioRepository,
        JwtAuthGuard,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    portfolioStore = [];
    jest.clearAllMocks();
  });

  const createUserAndToken = async () => {
    const user = {
      id: 1,
      email: 'user@example.com',
    };
    const token = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: 'USER',
    });
    return { user, token };
  };

  it('POST /portfolio crea una posición con datos válidos', async () => {
    const { user, token } = await createUserAndToken();
    const operationDate = '2026-05-01T10:00:00.000Z';

    const response = await request(app.getHttpServer())
      .post('/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticker: 'aapl',
        quantity: 10,
        operationDate,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      userId: user.id,
      ticker: 'AAPL',
      quantity: 10,
    });

    const created = await mockPrisma.portfolioItem.findMany({
      where: { userId: user.id },
    });
    expect(created).toHaveLength(1);
    expect(created[0].ticker).toBe('AAPL');
    expect(created[0].quantity).toBe(10);
    expect(created[0].operationDate.toISOString()).toBe(operationDate);
  });

  it('POST /portfolio rechaza ticker vacío', async () => {
    const { token } = await createUserAndToken();

    await request(app.getHttpServer())
      .post('/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticker: '   ',
        quantity: 5,
        operationDate: '2026-05-01T10:00:00.000Z',
      })
      .expect(400)
      .expect((res: request.Response) => {
        expect(res.body.message).toBe('El ticker no puede estar vacío');
      });
  });

  it('POST /portfolio rechaza cantidad menor o igual a cero', async () => {
    const { token } = await createUserAndToken();

    await request(app.getHttpServer())
      .post('/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticker: 'AAPL',
        quantity: 0,
        operationDate: '2026-05-01T10:00:00.000Z',
      })
      .expect(400)
      .expect((res: request.Response) => {
        expect(res.body.message).toBe('La cantidad debe ser mayor a cero');
      });
  });

  it('POST /portfolio requiere autenticación', async () => {
    await request(app.getHttpServer())
      .post('/portfolio')
      .send({
        ticker: 'AAPL',
        quantity: 2,
        operationDate: '2026-05-01T10:00:00.000Z',
      })
      .expect(401)
      .expect((res: request.Response) => {
        expect(res.body.message).toBe('Token de autenticación requerido.');
      });
  });
});

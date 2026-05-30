/// <reference types="jest" />

// ---------------------------------------------------------------------------
// Hoist Prisma mocks before any imports so the transitive import chain
// prices.service → prisma.service → @prisma/client is fully intercepted.
// ---------------------------------------------------------------------------
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    batchLog: { create: jest.fn(), findFirst: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AdminOrApiKeyGuard } from '../../src/prices/admin-or-api-key.guard';
import { PricesController } from '../../src/prices/prices.controller';
import { PricesService } from '../../src/prices/service/prices.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

// ---------------------------------------------------------------------------
// Constants shared across tests
// ---------------------------------------------------------------------------
const TEST_SECRET = 'test-secret';
const API_KEY = 'test-api-key';

// ---------------------------------------------------------------------------
// Controlled mock data for US 3.3
// ---------------------------------------------------------------------------
interface LastUpdateResponse {
  lastUpdate: string | null;
  message: string;
  tickersProcessed: number;
  success: number;
  errors: number;
  details: Array<{ ticker: string; price?: number; error?: string }>;
}

const MOCK_LAST_UPDATE: LastUpdateResponse = {
  lastUpdate: '2025-06-01T10:00:00.000Z',
  message: 'Última actualización de precios recuperada exitosamente.',
  tickersProcessed: 2,
  success: 2,
  errors: 0,
  details: [
    { ticker: 'AAPL', price: 185.0 },
    { ticker: 'MSFT', price: 420.0 },
  ],
};

const MOCK_EMPTY_LAST_UPDATE: LastUpdateResponse = {
  lastUpdate: null,
  message: 'No hay precios registrados. El batch nunca fue ejecutado.',
  tickersProcessed: 0,
  success: 0,
  errors: 0,
  details: [],
};

// ---------------------------------------------------------------------------
// Mock PricesService — avoids spawning Python and touching the DB
// ---------------------------------------------------------------------------
const mockPricesService = {
  runUpdateBatch: jest.fn().mockResolvedValue({
    tickersProcessed: 3,
    success: 3,
    errors: 0,
  }),
  getLastUpdate: jest.fn().mockResolvedValue(MOCK_LAST_UPDATE),
};

// ---------------------------------------------------------------------------
// Helper: sign a JWT with the test secret
// ---------------------------------------------------------------------------
function signToken(jwtService: JwtService, payload: object): string {
  return jwtService.sign(payload);
}

// ---------------------------------------------------------------------------
// E2E test suite
// ---------------------------------------------------------------------------
describe('PricesController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    // Set env variables consumed by guards via ConfigService / JwtModule
    process.env.ADMIN_API_KEY = API_KEY;
    process.env.JWT_SECRET = TEST_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // US 3.1 / US 3.2 / US 3.3 — ConfigModule reads ADMIN_API_KEY from process.env
        ConfigModule.forRoot({ isGlobal: true }),
        // JWT module wired with the test secret so guards can verify tokens
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [PricesController],
      providers: [
        // US 3.1 / US 3.2 — composite guard under test
        AdminOrApiKeyGuard,
        // US 3.3 — standard JWT guard for last-update endpoint
        JwtAuthGuard,
        // Mocked service: no Python, no DB
        {
          provide: PricesService,
          useValue: mockPricesService,
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations after each individual test
    mockPricesService.runUpdateBatch.mockResolvedValue({
      tickersProcessed: 3,
      success: 3,
      errors: 0,
    });
    mockPricesService.getLastUpdate.mockResolvedValue(MOCK_LAST_UPDATE);
  });

  // -------------------------------------------------------------------------
  // POST /prices/update — US 3.1 and US 3.2
  // -------------------------------------------------------------------------

  // US 3.1 — ADMIN JWT allows triggering the batch update
  it('POST /prices/update with valid ADMIN JWT returns 200', async () => {
    const token = signToken(jwtService, {
      sub: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    const response = await request(app.getHttpServer())
      .post('/prices/update')
      .set('Authorization', `Bearer ${token}`)
      .expect(200); // US 3.1

    expect(response.body).toMatchObject({
      message: 'Stock price batch update completed.',
      tickersProcessed: expect.any(Number),
    });
    expect(mockPricesService.runUpdateBatch).toHaveBeenCalledTimes(1);
  });

  // US 3.2 — Static API key allows triggering the batch update (CI pipeline)
  it('POST /prices/update with valid API key returns 200', async () => {
    const response = await request(app.getHttpServer())
      .post('/prices/update')
      .set('Authorization', `Bearer ${API_KEY}`)
      .expect(200); // US 3.2

    expect(response.body).toMatchObject({
      message: 'Stock price batch update completed.',
    });
    expect(mockPricesService.runUpdateBatch).toHaveBeenCalledTimes(1);
  });

  // US 3.1 — No token must be rejected with 401
  it('POST /prices/update without token returns 401', async () => {
    await request(app.getHttpServer()).post('/prices/update').expect(401); // US 3.1
  });

  // US 3.1 — USER role JWT must be rejected with 403
  it('POST /prices/update with USER role JWT returns 403', async () => {
    const token = signToken(jwtService, {
      sub: 2,
      email: 'user@test.com',
      role: 'USER',
    });

    await request(app.getHttpServer())
      .post('/prices/update')
      .set('Authorization', `Bearer ${token}`)
      .expect(403); // US 3.1
  });

  // -------------------------------------------------------------------------
  // GET /prices/last-update — US 3.3
  // -------------------------------------------------------------------------

  // US 3.3 — Authenticated user can read the last batch update timestamp
  it('GET /prices/last-update with valid JWT returns 200 with lastUpdate payload', async () => {
    const token = signToken(jwtService, {
      sub: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    const response = await request(app.getHttpServer())
      .get('/prices/last-update')
      .set('Authorization', `Bearer ${token}`)
      .expect(200); // US 3.3

    expect(response.body).toMatchObject({
      lastUpdate: MOCK_LAST_UPDATE.lastUpdate,
      message: MOCK_LAST_UPDATE.message,
      tickersProcessed: MOCK_LAST_UPDATE.tickersProcessed,
      success: MOCK_LAST_UPDATE.success,
      errors: MOCK_LAST_UPDATE.errors,
    });
    expect(Array.isArray(response.body.details)).toBe(true);
  });

  // US 3.3 — Unauthenticated request to last-update must return 401
  it('GET /prices/last-update without JWT returns 401', async () => {
    await request(app.getHttpServer()).get('/prices/last-update').expect(401); // US 3.3
  });

  // US 3.3 — Empty state when no batch has ever run
  it('GET /prices/last-update returns empty state when no batch has run', async () => {
    mockPricesService.getLastUpdate.mockResolvedValueOnce(
      MOCK_EMPTY_LAST_UPDATE,
    );

    const token = signToken(jwtService, {
      sub: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
    });

    const response = await request(app.getHttpServer())
      .get('/prices/last-update')
      .set('Authorization', `Bearer ${token}`)
      .expect(200); // US 3.3

    expect(response.body.lastUpdate).toBeNull();
    expect(response.body.details).toEqual([]);
    expect(response.body.tickersProcessed).toBe(0);
  });
});

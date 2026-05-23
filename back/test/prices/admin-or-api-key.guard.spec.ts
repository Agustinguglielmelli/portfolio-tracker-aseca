import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrApiKeyGuard } from '../../src/prices/admin-or-api-key.guard';

const VALID_API_KEY = 'test-api-key';
const ADMIN_JWT = 'valid.admin.jwt';
const USER_JWT = 'valid.user.jwt';
const INVALID_JWT = 'invalid.or.expired.jwt';

/**
 * Helper: build a mock ExecutionContext with the given Authorization header.
 */
function mockContext(authHeader?: string): ExecutionContext {
  const request = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AdminOrApiKeyGuard', () => {
  let guard: AdminOrApiKeyGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOrApiKeyGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn((token: string) => {
              if (token === ADMIN_JWT) {
                return { sub: 1, email: 'admin@test.com', role: 'ADMIN' };
              }
              if (token === USER_JWT) {
                return { sub: 2, email: 'user@test.com', role: 'USER' };
              }
              throw new Error('invalid signature');
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_API_KEY') return VALID_API_KEY;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminOrApiKeyGuard>(AdminOrApiKeyGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // US 3.1 — ADMIN JWT grants access to the update endpoint
  it('allows request with valid ADMIN JWT', () => {
    const ctx = mockContext(`Bearer ${ADMIN_JWT}`);
    expect(guard.canActivate(ctx)).toBe(true); // US 3.1
  });

  // US 3.2 — Static API key grants access for CI pipelines
  it('allows request with valid static API key', () => {
    const ctx = mockContext(`Bearer ${VALID_API_KEY}`);
    expect(guard.canActivate(ctx)).toBe(true); // US 3.2
  });

  // US 3.1 — Non-admin JWT must be rejected with 403
  it('throws ForbiddenException when JWT has USER role', () => {
    const ctx = mockContext(`Bearer ${USER_JWT}`);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException); // US 3.1
  });

  // US 3.1 — Malformed / expired JWT must be rejected with 401
  it('throws UnauthorizedException when JWT is invalid/expired', () => {
    const ctx = mockContext(`Bearer ${INVALID_JWT}`);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException); // US 3.1
  });

  // US 3.1 — Entirely missing Authorization header must be rejected with 401
  it('throws UnauthorizedException when Authorization header is missing', () => {
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException); // US 3.1
  });

  // US 3.1 — Authorization header present but with no token after "Bearer "
  it('throws UnauthorizedException when Bearer token is missing', () => {
    const ctx = mockContext('Bearer ');
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException); // US 3.1
  });
});

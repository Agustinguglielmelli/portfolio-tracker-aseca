import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminApiKeyGuard } from '../../src/prices/admin-api-key.guard';

const VALID_KEY = 'super-secret-admin-key';

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

describe('AdminApiKeyGuard', () => {
  let guard: AdminApiKeyGuard;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminApiKeyGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_API_KEY') return VALID_KEY;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminApiKeyGuard>(AdminApiKeyGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('allows a request with the correct Bearer token', () => {
    const ctx = mockContext(`Bearer ${VALID_KEY}`);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when Authorization header is missing', () => {
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the key is wrong', () => {
    const ctx = mockContext('Bearer wrong-key');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the scheme is not Bearer', () => {
    const ctx = mockContext(`Basic ${VALID_KEY}`);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when ADMIN_API_KEY is not configured', () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);
    const ctx = mockContext(`Bearer ${VALID_KEY}`);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

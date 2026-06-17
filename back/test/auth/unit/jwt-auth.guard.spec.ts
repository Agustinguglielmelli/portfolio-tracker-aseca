import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    const req = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no auth header', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if scheme is not Bearer', () => {
    const context = createMockContext('Basic token');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if scheme is Bearer but no token is provided', () => {
    const context = createMockContext('Bearer ');
    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Token de autenticación requerido.'),
    );
  });

  it('should throw UnauthorizedException if token is invalid', () => {
    const context = createMockContext('Bearer invalidtoken');
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should attach payload to request and return true on success', () => {
    const context = createMockContext('Bearer validtoken');
    const mockPayload = { sub: 1, email: 'user@test.com', role: 'USER' };
    (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(mockPayload);
  });

  it('should assign default USER role if payload does not contain a role', () => {
    const context = createMockContext('Bearer validtoken');
    const mockPayloadWithoutRole = { sub: 2, email: 'norole@test.com' };
    (jwtService.verify as jest.Mock).mockReturnValue(mockPayloadWithoutRole);
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({ ...mockPayloadWithoutRole, role: 'USER' });
  });
});

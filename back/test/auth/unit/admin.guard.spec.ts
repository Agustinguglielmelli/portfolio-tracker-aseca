import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../../../src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let jwtAuthGuard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as any;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw if JwtAuthGuard throws', () => {
    (jwtAuthGuard.canActivate as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedException();
    });
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user is not ADMIN', () => {
    (jwtAuthGuard.canActivate as jest.Mock).mockReturnValue(true);
    const context = createMockContext({
      sub: 1,
      email: 'user@test.com',
      role: 'USER',
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user object is missing', () => {
    (jwtAuthGuard.canActivate as jest.Mock).mockReturnValue(true);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should return true if user is ADMIN', () => {
    (jwtAuthGuard.canActivate as jest.Mock).mockReturnValue(true);
    const context = createMockContext({
      sub: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});

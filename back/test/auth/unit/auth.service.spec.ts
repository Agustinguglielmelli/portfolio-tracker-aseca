import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/services/auth.service';
import { AuthRepository } from '../../../src/auth/repository/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../../../src/auth/dto/register.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockAuthRepository = {
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw BadRequestException if passwords do not match', async () => {
      const testUser: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password456!',
      };

      await expect(service.register(testUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(testUser)).rejects.toThrow(
        'Las contraseñas no son iguales, por favor, vuelva a ingresarlas.',
      );
    });

    it('should throw BadRequestException if email or password exceeds 256 characters', async () => {
      const longString = 'a'.repeat(257);
      const testUser: RegisterDto = {
        email: `${longString}@example.com`,
        password: longString,
        confirmPassword: longString,
      };

      await expect(service.register(testUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(testUser)).rejects.toThrow(
        'El mail y la contraseña no pueden ser mayores a 256 caracteres.',
      );
    });

    it('should throw BadRequestException if email is already registered', async () => {
      const testUser: RegisterDto = {
        email: 'unico@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue({
        id: 1,
        email: 'unico@example.com',
      });

      await expect(service.register(testUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(testUser)).rejects.toThrow(
        'El mail ya está registrado',
      );
    });

    it('should hash the password before saving', async () => {
      const testUser: RegisterDto = {
        email: 'encriptado@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const mockCreatedUser = {
        id: 1,
        email: 'encriptado@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('mocked_jwt_token');

      await service.register(testUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        'encriptado@example.com',
        'hashedPassword',
      );
    });

    it('should register user with mail and password and return access_token', async () => {
      const testUser: RegisterDto = {
        email: 'nuevo@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const mockCreatedUser = {
        id: 1,
        email: 'nuevo@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('mocked_jwt_token');

      const result = await service.register(testUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockCreatedUser.id,
        email: mockCreatedUser.email,
        role: mockCreatedUser.role,
      });

      expect(result).toEqual({
        message: 'Registro exitoso',
        access_token: 'mocked_jwt_token',
      });
    });
  });

  describe('login', () => {
    it('should throw BadRequestException if email or password exceeds 256 characters', async () => {
      const longString = 'a'.repeat(257);
      const loginDto = {
        email: `${longString}@example.com`,
        password: longString,
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'El mail y la contraseña no pueden ser mayores a 256 caracteres.',
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginDto = {
        email: 'noexiste@example.com',
        password: 'Password123!',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('should throw UnauthorizedException if password is not valid', async () => {
      const loginDto = {
        email: 'valido@example.com',
        password: 'WrongPassword!',
      };

      const mockUser = {
        id: 1,
        email: 'valido@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('should login successfully and return a token', async () => {
      const loginDto = {
        email: 'valido@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 1,
        email: 'valido@example.com',
        password: 'hashedPassword',
        role: 'USER',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mocked_jwt_token');

      const result = await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      expect(result).toEqual({
        message: 'Login exitoso',
        token: 'mocked_jwt_token',
      });
    });
  });
});

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    if (body.email?.length > 256 || body.password?.length > 256) {
      throw new BadRequestException(
        'El mail y la contraseña no pueden ser mayores a 256 caracteres.',
      );
    }

    if (body.password !== body.confirmPassword) {
      throw new BadRequestException(
        'Las contraseñas no son iguales, por favor, vuelva a ingresarlas.',
      );
    }

    const existingUser = await this.authRepository.findUserByEmail(body.email);

    if (existingUser) {
      throw new BadRequestException('El mail ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.authRepository.createUser(
      body.email,
      hashedPassword,
    );

    const payload = { sub: user.id, email: user.email };

    return {
      message: 'Registro exitoso',
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(body: LoginDto) {
    if (body.email?.length > 256 || body.password?.length > 256) {
      throw new BadRequestException(
        'El mail y la contraseña no pueden ser mayores a 256 caracteres.',
      );
    }

    const user = await this.authRepository.findUserByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      message: 'Login exitoso',
      token: this.jwtService.sign(payload),
    };
  }
}

import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new BadRequestException('El mail ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id, email: user.email };

    return {
      message: 'Registro exitoso',
      access_token: this.jwtService.sign(payload),
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    if (body.email?.length > 256 || body.password?.length > 256) {
      throw new BadRequestException(
        'El mail y la contraseña no pueden ser mayores a 256 caracteres.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

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

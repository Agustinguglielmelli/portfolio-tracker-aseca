import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './register.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

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

    await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
      },
    });

    return { message: 'Registro exitoso' };
  }
}

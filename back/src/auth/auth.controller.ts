import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}

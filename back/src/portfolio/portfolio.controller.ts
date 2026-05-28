import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  async create(@Body() body: CreatePortfolioItemDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token de autenticación requerido.');
    }
    return this.portfolioService.createPortfolioItem(user.sub, body);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { PortfolioService } from './service/portfolio.service';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post('buy')
  async buy(@Body() dto: BuyDto, @Req() req: Request) {
    return this.portfolioService.buy(this.getUserId(req), dto);
  }

  @Post('sell')
  async sell(@Body() dto: SellDto, @Req() req: Request) {
    return this.portfolioService.sell(this.getUserId(req), dto);
  }

  @Get()
  async getPortfolio(@Req() req: Request) {
    return this.portfolioService.getPortfolio(this.getUserId(req));
  }

  @Get('transactions')
  getAllTransactions(@Req() req: Request) {
    return this.portfolioService.getAllTransactions(this.getUserId(req));
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.portfolioService.deleteTransaction(this.getUserId(req), id);
  }

  private getUserId(req: Request): number {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user?.sub)
      throw new UnauthorizedException('Token de autenticación requerido.');
    return user.sub;
  }
}

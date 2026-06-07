import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PortfolioService } from './service/portfolio.service';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}
}

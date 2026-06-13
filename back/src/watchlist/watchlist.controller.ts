import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WatchlistService } from './service/watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddWatchlistDto } from './dto/add-watchlist.dto';

@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  async add(@Request() req, @Body() dto: AddWatchlistDto) {
    return this.watchlistService.add(req.user.userId, dto.ticker);
  }
}

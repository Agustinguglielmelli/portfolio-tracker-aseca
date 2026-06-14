import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { WatchlistService } from './service/watchlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddWatchlistDto } from './dto/add-watchlist.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  async add(@Request() req: RequestWithUser, @Body() dto: AddWatchlistDto) {
    return this.watchlistService.add(req.user.userId, dto.ticker);
  }

  @Delete(':ticker')
  async remove(
    @Request() req: RequestWithUser,
    @Param('ticker') ticker: string,
  ) {
    return this.watchlistService.remove(req.user.userId, ticker);
  }

  @Get()
  async getList(@Request() req) {
    return this.watchlistService.getList(req.user.userId);
  }
}

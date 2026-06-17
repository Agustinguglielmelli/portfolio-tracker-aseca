import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './service/watchlist.service';
import { WatchlistRepository } from './repository/watchlist.repository';

@Module({
  imports: [AuthModule, CompaniesModule],
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistRepository],
})
export class WatchlistModule {}

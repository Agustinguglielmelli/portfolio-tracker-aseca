import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { PricesModule } from './prices/prices.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    PricesModule,
    PortfolioModule,
    WatchlistModule,
  ],
})
export class AppModule {}

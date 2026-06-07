import { PortfolioTransaction } from '@prisma/client';

export type PortfolioPosition = {
  ticker: string;
  totalShares: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
};

export type { PortfolioTransaction };

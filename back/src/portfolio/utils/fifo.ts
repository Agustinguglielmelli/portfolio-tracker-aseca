import { Transaction, TransactionType } from '@prisma/client';

export interface FifoLot {
  transactionId: number;
  quantity: number;
  priceAtOp: number;
  date: Date;
}

export function applyFifo(transactions: Transaction[]): FifoLot[] {
  const buys = transactions
    .filter((t) => t.type === TransactionType.BUY)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const sells = transactions
    .filter((t) => t.type === TransactionType.SELL)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const lots: FifoLot[] = buys.map((t) => ({
    transactionId: t.id,
    quantity: t.quantity,
    priceAtOp: t.priceAtOp,
    date: t.date,
  }));

  for (const sell of sells) {
    let remaining = sell.quantity;

    for (const lot of lots) {
      if (remaining <= 0) break;

      if (lot.quantity <= remaining) {
        remaining -= lot.quantity;
        lot.quantity = 0;
      } else {
        lot.quantity -= remaining;
        remaining = 0;
      }
    }
  }

  return lots.filter((lot) => lot.quantity > 0);
}

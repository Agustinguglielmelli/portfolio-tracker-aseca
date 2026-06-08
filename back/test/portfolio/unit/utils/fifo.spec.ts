import { applyFifo } from '../../../../src/portfolio/utils/helpers';
import { TransactionType } from '@prisma/client';

const makeBuy = (
  id: number,
  quantity: number,
  priceAtOp: number,
  date: string,
) => ({
  id,
  userId: 1,
  ticker: 'AAPL',
  type: TransactionType.BUY,
  quantity,
  priceAtOp,
  date: new Date(date),
  createdAt: new Date(date),
});

const makeSell = (
  id: number,
  quantity: number,
  priceAtOp: number,
  date: string,
) => ({
  id,
  userId: 1,
  ticker: 'AAPL',
  type: TransactionType.SELL,
  quantity,
  priceAtOp,
  date: new Date(date),
  createdAt: new Date(date),
});

describe('applyFifo', () => {
  it('sin transacciones devuelve lotes vacíos', () => {
    expect(applyFifo([])).toEqual([]);
  });

  it('solo compras devuelve todos los lotes', () => {
    const txs = [
      makeBuy(1, 10, 100, '2026-01-01'),
      makeBuy(2, 5, 120, '2026-02-01'),
    ];

    expect(applyFifo(txs)).toEqual([
      {
        transactionId: 1,
        quantity: 10,
        priceAtOp: 100,
        date: new Date('2026-01-01'),
      },
      {
        transactionId: 2,
        quantity: 5,
        priceAtOp: 120,
        date: new Date('2026-02-01'),
      },
    ]);
  });

  it('venta reduce el lote más viejo', () => {
    const txs = [
      makeBuy(1, 10, 100, '2026-01-01'),
      makeSell(2, 3, 150, '2026-02-01'),
    ];

    expect(applyFifo(txs)).toEqual([
      {
        transactionId: 1,
        quantity: 7,
        priceAtOp: 100,
        date: new Date('2026-01-01'),
      },
    ]);
  });

  it('venta que agota un lote y consume parte del siguiente', () => {
    const txs = [
      makeBuy(1, 10, 100, '2026-01-01'),
      makeBuy(2, 10, 200, '2026-02-01'),
      makeSell(3, 12, 150, '2026-03-01'),
    ];

    expect(applyFifo(txs)).toEqual([
      {
        transactionId: 2,
        quantity: 8,
        priceAtOp: 200,
        date: new Date('2026-02-01'),
      },
    ]);
  });

  it('venta que agota todos los lotes devuelve vacío', () => {
    const txs = [
      makeBuy(1, 10, 100, '2026-01-01'),
      makeBuy(2, 5, 120, '2026-02-01'),
      makeSell(3, 15, 150, '2026-03-01'),
    ];

    expect(applyFifo(txs)).toEqual([]);
  });

  it('respeta orden cronológico sin importar el orden de inserción', () => {
    const txs = [
      makeBuy(2, 10, 200, '2026-02-01'),
      makeBuy(1, 10, 100, '2026-01-01'),
      makeSell(3, 5, 150, '2026-03-01'),
    ];
    expect(applyFifo(txs)).toEqual([
      {
        transactionId: 1,
        quantity: 5,
        priceAtOp: 100,
        date: new Date('2026-01-01'),
      },
      {
        transactionId: 2,
        quantity: 10,
        priceAtOp: 200,
        date: new Date('2026-02-01'),
      },
    ]);
  });

  it('varias ventas acumuladas consumen los lotes en orden', () => {
    const txs = [
      makeBuy(1, 10, 100, '2026-01-01'),
      makeBuy(2, 10, 200, '2026-02-01'),
      makeSell(3, 6, 150, '2026-03-01'),
      makeSell(4, 6, 160, '2026-04-01'),
    ];

    expect(applyFifo(txs)).toEqual([
      {
        transactionId: 2,
        quantity: 8,
        priceAtOp: 200,
        date: new Date('2026-02-01'),
      },
    ]);
  });
});

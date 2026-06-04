import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import {
  BatchResult,
  PricesService,
  SpawnFn,
} from '../../src/prices/service/prices.service';
import { PrismaService } from '../../src/prisma/prisma.service';

interface FakeChildConfig {
  stdoutLines?: string[];
  stderrLines?: string[];
  exitCode?: number;
}

function makeFakeChild(config: FakeChildConfig): any {
  const child = new EventEmitter() as any;
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });

  setImmediate(() => {
    for (const line of config.stdoutLines ?? []) {
      child.stdout.push(line + '\n');
    }
    child.stdout.push(null);

    for (const line of config.stderrLines ?? []) {
      child.stderr.push(line + '\n');
    }
    child.stderr.push(null);

    child.emit('close', config.exitCode ?? 0);
  });

  return child;
}

const mockPrismaService = {
  batchLog: {
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn().mockResolvedValue(null),
  },
};

describe('PricesService', () => {
  let service: PricesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
  });

  afterEach(() => jest.restoreAllMocks());
  function useChild(child: any): jest.Mock {
    const mockSpawn = jest
      .fn<ReturnType<SpawnFn>, Parameters<SpawnFn>>()
      .mockReturnValue(child);
    service.setSpawnFn(mockSpawn);
    return mockSpawn;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('resolves with parsed BatchResult and stores TICKER_DETAIL in BatchLog', async () => {
    const fakeChild = makeFakeChild({
      stdoutLines: [
        '2024-01-01T00:00:00 [INFO] Script started',
        'TICKER_DETAIL: ticker=AAPL status=SUCCESS price=190.50',
        'TICKER_DETAIL: ticker=MSFT status=ERROR error=Could not retrieve price',
        'BATCH_RESULT: tickersProcessed=2 success=1 errors=1',
      ],
      exitCode: 0,
    });
    const spawnMock = useChild(fakeChild);

    const result: BatchResult = await service.runUpdateBatch();

    expect(spawnMock).toHaveBeenCalledWith(
      'python3',
      expect.arrayContaining([expect.stringContaining('update_prices.py')]),
      expect.objectContaining({ env: expect.any(Object) }),
    );
    expect(result).toEqual<BatchResult>({
      tickersProcessed: 2,
      success: 1,
      errors: 1,
    });
    expect(mockPrismaService.batchLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tickersProcessed: 2,
          success: 1,
          errors: 1,
          details: [
            { ticker: 'AAPL', price: 190.5 },
            { ticker: 'MSFT', error: 'Could not retrieve price' },
          ],
        }),
      }),
    );
  });

  it('returns zeroed BatchResult when BATCH_RESULT line is absent', async () => {
    const fakeChild = makeFakeChild({
      stdoutLines: ['Some log line without a BATCH_RESULT'],
      exitCode: 0,
    });
    useChild(fakeChild);

    const result: BatchResult = await service.runUpdateBatch();
    expect(result).toEqual<BatchResult>({
      tickersProcessed: 0,
      success: 0,
      errors: 0,
    });
  });

  it('rejects with ServiceUnavailableException when exit code is non-zero', async () => {
    const fakeChild = makeFakeChild({ exitCode: 1 });
    useChild(fakeChild);

    await expect(service.runUpdateBatch()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects with ServiceUnavailableException on spawn error', async () => {
    const child = new EventEmitter() as any;
    child.stdout = new Readable({ read() {} });
    child.stderr = new Readable({ read() {} });
    useChild(child);

    const promise = service.runUpdateBatch();
    setImmediate(() => child.emit('error', new Error('python3 not found')));

    await expect(promise).rejects.toThrow(ServiceUnavailableException);
  });
  it('getLastUpdate returns empty-state response when no BatchLog exists', async () => {
    mockPrismaService.batchLog.findFirst.mockResolvedValueOnce(null);
    const result = await service.getLastUpdate();
    expect(result.lastUpdate).toBeNull();
    expect(result.details).toEqual([]);
  });
  it('getLastUpdate returns formatted response when BatchLog exists', async () => {
    const fakeLog = {
      id: 1,
      ranAt: new Date('2025-01-01T12:00:00Z'),
      tickersProcessed: 2,
      success: 1,
      errors: 1,
      details: [
        { ticker: 'AAPL', price: 190.5 },
        { ticker: 'MSFT', error: 'Could not retrieve price' },
      ],
    };
    mockPrismaService.batchLog.findFirst.mockResolvedValueOnce(fakeLog);

    const result = await service.getLastUpdate();
    expect(result.lastUpdate).toBe('2025-01-01T12:00:00.000Z');
    expect(result.tickersProcessed).toBe(2);
    expect(result.details).toHaveLength(2);
  });
});

import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import {
  BatchResult,
  PricesService,
  SpawnFn,
} from '../../src/prices/prices.service';

// ---------------------------------------------------------------------------
// Helpers to build a fake child process
// ---------------------------------------------------------------------------
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
    child.stdout.push(null); // EOF

    for (const line of config.stderrLines ?? []) {
      child.stderr.push(line + '\n');
    }
    child.stderr.push(null); // EOF

    child.emit('close', config.exitCode ?? 0);
  });

  return child;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PricesService', () => {
  let service: PricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricesService],
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

  it('resolves with parsed BatchResult on successful child process exit', async () => {
    const fakeChild = makeFakeChild({
      stdoutLines: [
        '2024-01-01T00:00:00 [INFO] Script started',
        'BATCH_RESULT: tickersProcessed=3 success=2 errors=1',
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
      tickersProcessed: 3,
      success: 2,
      errors: 1,
    });
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
});

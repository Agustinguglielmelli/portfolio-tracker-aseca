import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  spawn,
  SpawnOptionsWithoutStdio,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import { resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface BatchResult {
  tickersProcessed: number;
  success: number;
  errors: number;
}

// US 3.3 — Per-ticker detail entry in the BatchLog
export interface TickerDetail {
  ticker: string;
  price?: number;
  error?: string;
}

// US 3.3 — Shape of the response from GET /prices/last-update
export interface LastUpdateResponse {
  lastUpdate: string | null;
  message: string;
  tickersProcessed: number;
  success: number;
  errors: number;
  details: TickerDetail[];
}

export type SpawnFn = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) => ChildProcessWithoutNullStreams;

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly scriptPath = resolve(
    process.cwd(),
    'scripts',
    'update_prices.py',
  );
  private spawnFn: SpawnFn = spawn;
  setSpawnFn(fn: SpawnFn) {
    this.spawnFn = fn;
  }

  // US 3.3 — Inject PrismaService to persist BatchLog and query last-update
  constructor(private readonly prisma: PrismaService) {}

  // US 3.1 — Runs the Python batch script and persists the result to BatchLog
  async runUpdateBatch(): Promise<BatchResult> {
    this.logger.log(`Spawning Python script: ${this.scriptPath}`);

    return new Promise<BatchResult>((resolve, reject) => {
      const child = this.spawnFn('python3', [this.scriptPath], {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      } as SpawnOptionsWithoutStdio);

      let batchResult: BatchResult | null = null;
      // US 3.3 — Collect per-ticker details from script stdout
      const tickerDetails: TickerDetail[] = [];

      child.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        text
          .split('\n')
          .filter((line) => line.trim())
          .forEach((line) => {
            if (line.startsWith('BATCH_RESULT:')) {
              const match = line.match(
                /tickersProcessed=(\d+)\s+success=(\d+)\s+errors=(\d+)/,
              );
              if (match) {
                batchResult = {
                  tickersProcessed: parseInt(match[1], 10),
                  success: parseInt(match[2], 10),
                  errors: parseInt(match[3], 10),
                };
              }
            } else if (line.startsWith('TICKER_DETAIL:')) {
              // US 3.3 — Parse per-ticker detail lines emitted by the Python script
              const tickerMatch = line.match(/ticker=(\S+)/);
              const statusMatch = line.match(/status=(\S+)/);
              const priceMatch = line.match(/price=([\d.]+)/);
              const errorMatch = line.match(/error=(.+)$/);
              if (tickerMatch && statusMatch) {
                const detail: TickerDetail = { ticker: tickerMatch[1] };
                if (statusMatch[1] === 'SUCCESS' && priceMatch) {
                  detail.price = parseFloat(priceMatch[1]);
                } else if (errorMatch) {
                  detail.error = errorMatch[1].trim();
                }
                tickerDetails.push(detail);
              }
            } else {
              this.logger.log(`[python] ${line}`);
            }
          });
      });

      child.stderr.on('data', (chunk: Buffer) => {
        chunk
          .toString()
          .split('\n')
          .filter((line) => line.trim())
          .forEach((line) => this.logger.warn(`[python:stderr] ${line}`));
      });

      child.on('error', (err) => {
        this.logger.error(`Failed to spawn Python process: ${err.message}`);
        reject(
          new ServiceUnavailableException(
            `Could not launch the price update script: ${err.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}.`);
          reject(
            new ServiceUnavailableException(
              `Price update script failed with exit code ${code}.`,
            ),
          );
          return;
        }

        this.logger.log('Python script completed successfully.');
        const result = batchResult ?? {
          tickersProcessed: 0,
          success: 0,
          errors: 0,
        };

        // US 3.3 — Persist the batch result in BatchLog for last-update queries
        void (async () => {
          try {
            await this.prisma.batchLog.create({
              data: {
                tickersProcessed: result.tickersProcessed,
                success: result.success,
                errors: result.errors,
                details: tickerDetails as any,
              },
            });
            this.logger.log('BatchLog entry created.');
          } catch (dbErr) {
            this.logger.error(`Failed to persist BatchLog: ${dbErr}`);
          }

          resolve(result);
        })();
      });
    });
  }

  // US 3.3 — Returns the timestamp and details of the last successful batch run
  async getLastUpdate(): Promise<LastUpdateResponse> {
    const lastLog = await this.prisma.batchLog.findFirst({
      orderBy: { ranAt: 'desc' },
    });

    if (!lastLog) {
      // US 3.3 — Empty state: no batch has ever been executed
      return {
        lastUpdate: null,
        message: 'No hay precios registrados. El batch nunca fue ejecutado.',
        tickersProcessed: 0,
        success: 0,
        errors: 0,
        details: [],
      };
    }

    return {
      lastUpdate: lastLog.ranAt.toISOString(), // US 3.3
      message: 'Última actualización de precios recuperada exitosamente.',
      tickersProcessed: lastLog.tickersProcessed,
      success: lastLog.success,
      errors: lastLog.errors,
      details: (lastLog.details ?? []) as unknown as TickerDetail[], // US 3.3
    };
  }
}

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

export interface BatchResult {
  tickersProcessed: number;
  success: number;
  errors: number;
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

  async runUpdateBatch(): Promise<BatchResult> {
    this.logger.log(`Spawning Python script: ${this.scriptPath}`);

    return new Promise<BatchResult>((resolve, reject) => {
      const child = this.spawnFn('python3', [this.scriptPath], {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      } as SpawnOptionsWithoutStdio);

      let batchResult: BatchResult | null = null;

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
        resolve(batchResult ?? { tickersProcessed: 0, success: 0, errors: 0 });
      });
    });
  }
}

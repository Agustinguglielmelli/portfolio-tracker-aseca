import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

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

// Shape of the JSON response from the python-worker FastAPI service
interface PythonWorkerResponse {
  tickersProcessed: number;
  success: number;
  errors: number;
  details: TickerDetail[];
}

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly pythonWorkerUrl: string;

  // US 3.3 — Inject PrismaService to persist BatchLog and query last-update
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.pythonWorkerUrl =
      this.config.get<string>('PYTHON_WORKER_URL') ??
      'http://python-worker:8000';
  }

  // US 3.1 — Calls the python-worker FastAPI service and persists the result to BatchLog
  async runUpdateBatch(): Promise<BatchResult> {
    const endpoint = `${this.pythonWorkerUrl}/api/update-prices`;
    this.logger.log(`Calling python-worker: POST ${endpoint}`);

    let workerResponse: PythonWorkerResponse;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `python-worker responded with ${response.status}: ${body}`,
        );
        throw new ServiceUnavailableException(
          `Price update worker failed with status ${response.status}.`,
        );
      }

      workerResponse = (await response.json()) as PythonWorkerResponse;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`Failed to reach python-worker: ${String(err)}`);
      throw new ServiceUnavailableException(
        `Could not connect to the price update worker: ${String(err)}`,
      );
    }

    this.logger.log(
      `python-worker responded: ${workerResponse.success} updated, ${workerResponse.errors} failed.`,
    );

    const result: BatchResult = {
      tickersProcessed: workerResponse.tickersProcessed,
      success: workerResponse.success,
      errors: workerResponse.errors,
    };

    // US 3.3 — Persist the batch result in BatchLog for last-update queries
    try {
      await this.prisma.batchLog.create({
        data: {
          tickersProcessed: result.tickersProcessed,
          success: result.success,
          errors: result.errors,
          details: workerResponse.details as any,
        },
      });
      this.logger.log('BatchLog entry created.');
    } catch (dbErr) {
      this.logger.error(`Failed to persist BatchLog: ${dbErr}`);
    }

    return result;
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

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { PricesService } from '../../../src/prices/service/prices.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

const mockPrismaService = {
  batchLog: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn(),
};

global.fetch = jest.fn();

describe('PricesService', () => {
  let service: PricesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('http://python-worker:8000');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runUpdateBatch', () => {
    it('should successfully run update batch and log it', async () => {
      const mockWorkerResponse = {
        tickersProcessed: 10,
        success: 8,
        errors: 2,
        details: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkerResponse),
      });

      const result = await service.runUpdateBatch();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://python-worker:8000/api/update-prices',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      expect(result).toEqual({
        tickersProcessed: 10,
        success: 8,
        errors: 2,
      });
      expect(jest.spyOn(prismaService.batchLog, 'create')).toHaveBeenCalledWith(
        {
          data: {
            tickersProcessed: 10,
            success: 8,
            errors: 2,
            details: [],
          },
        },
      );
    });

    it('should throw exception if fetch response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await expect(service.runUpdateBatch()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw exception if fetch throws an error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.runUpdateBatch()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should handle database error silently when creating batch log', async () => {
      const mockWorkerResponse = {
        tickersProcessed: 1,
        success: 1,
        errors: 0,
        details: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockWorkerResponse),
      });

      mockPrismaService.batchLog.create.mockRejectedValue(
        new Error('DB Error'),
      );

      const result = await service.runUpdateBatch();

      expect(result).toEqual({
        tickersProcessed: 1,
        success: 1,
        errors: 0,
      });
      expect(jest.spyOn(prismaService.batchLog, 'create')).toHaveBeenCalled();
    });
  });

  describe('getLastUpdate', () => {
    it('should return last update when log exists', async () => {
      const date = new Date();
      mockPrismaService.batchLog.findFirst.mockResolvedValue({
        ranAt: date,
        tickersProcessed: 5,
        success: 5,
        errors: 0,
        details: [],
      });

      const result = await service.getLastUpdate();

      expect(result).toEqual({
        lastUpdate: date.toISOString(),
        message: 'Última actualización de precios recuperada exitosamente.',
        tickersProcessed: 5,
        success: 5,
        errors: 0,
        details: [],
      });
    });

    it('should return default response when no log exists', async () => {
      mockPrismaService.batchLog.findFirst.mockResolvedValue(null);

      const result = await service.getLastUpdate();

      expect(result).toEqual({
        lastUpdate: null,
        message: 'No hay precios registrados. El batch nunca fue ejecutado.',
        tickersProcessed: 0,
        success: 0,
        errors: 0,
        details: [],
      });
    });
  });
});

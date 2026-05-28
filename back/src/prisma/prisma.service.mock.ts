import { Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from './prisma.service';

export const mockPrisma =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaService>;

export const prismaMockProvider: Provider = {
  provide: PrismaService,
  useValue: mockPrisma,
};

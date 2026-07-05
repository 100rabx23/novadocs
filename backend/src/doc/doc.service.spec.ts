import { Test, TestingModule } from '@nestjs/testing';
import { DocService } from './doc.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  document: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('DocService', () => {
  let service: DocService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DocService>(DocService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query Prisma and return list of documents', async () => {
      const mockResult = [{ id: '1', title: 'Test Doc', content: 'test', userId: 'usr1' }];
      mockPrisma.document.findMany.mockResolvedValue(mockResult);

      const result = await service.findAll('usr1');
      expect(result).toEqual(mockResult);
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { userId: 'usr1' },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return document if it exists', async () => {
      const mockResult = { id: '1', title: 'Test Doc', content: 'test', userId: 'usr1' };
      mockPrisma.document.findFirst.mockResolvedValue(mockResult);

      const result = await service.findOne('usr1', '1');
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if document does not exist', async () => {
      mockPrisma.document.findFirst.mockResolvedValue(null);
      await expect(service.findOne('usr1', '2')).rejects.toThrow(NotFoundException);
    });
  });
});

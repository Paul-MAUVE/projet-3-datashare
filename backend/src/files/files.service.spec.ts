import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('FilesService', () => {
  let service: FilesService;

  let prismaService: {
    file: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prismaService = {
      file: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return files belonging to the user', async () => {
    // GIVEN
    const userId = 1;

    const files = [
      {
        id: 3,
        originalName: 'document.pdf',
        size: BigInt(8961),
        uploadDate: new Date('2026-09-21T09:17:03.526Z'),
        expirationDate: new Date('2026-09-28T09:17:03.526Z'),
        userId: 1,
      },
    ];

    prismaService.file.findMany.mockResolvedValue(files);

    // WHEN
    const result = await service.findAllByUser(userId);

    // THEN
    expect(prismaService.file.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
      },
    });

    expect(result).toEqual([
      {
        id: 3,
        fileName: 'document.pdf',
        size: 8961,
        uploadDate: new Date('2026-09-21T09:17:03.526Z'),
        expirationDate: new Date('2026-09-28T09:17:03.526Z'),
      },
    ]);
  });

  it('should return file metadata without internal fields', async () => {
    // GIVEN
    const userId = 1;

    prismaService.file.findMany.mockResolvedValue([
      {
        id: 3,
        originalName: 'document.pdf',
        storageKey: 'uploads/secret-key-document.pdf',
        mimeType: 'application/pdf',
        size: BigInt(8961),
        uploadDate: new Date('2026-09-21T09:17:03.526Z'),
        expirationDate: new Date('2026-09-28T09:17:03.526Z'),
        downloadToken: 'secret-token',
        passwordHash: null,
        userId: 1,
      },
    ]);

    // WHEN
    const result = await service.findAllByUser(userId);

    // THEN
    expect(result).toEqual([
      {
        id: 3,
        fileName: 'document.pdf',
        size: 8961,
        uploadDate: new Date('2026-09-21T09:17:03.526Z'),
        expirationDate: new Date('2026-09-28T09:17:03.526Z'),
      },
    ]);
  });

});
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, GoneException } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

describe('FilesService', () => {
  let service: FilesService;
  let prismaService: {
    file: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
  let storageService: {
    deleteObject: ReturnType<typeof vi.fn>;
    generateDownloadUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prismaService = {
      file: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn()
      },
    };
    storageService = {
      deleteObject: vi.fn(),
      generateDownloadUrl: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: StorageService,
          useValue: storageService,
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
        downloadToken: 'test-token',
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
        downloadUrl: '/api/download/test-token'
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
        downloadToken: 'test-token',
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
        downloadUrl: '/api/download/test-token'
      },
    ]);
  });

  it('should delete the file from storage', async () => {
    // GIVEN
    const fileId = 3;
    const userId = 1;

    const file = {
      id: 3,
      storageKey: 'uploads/abc-document.pdf',
      userId: 1,
    };

    prismaService.file.findUnique.mockResolvedValue(file);

    // WHEN
    await service.deleteFileById(fileId, userId);

    // THEN
    expect(storageService.deleteObject).toHaveBeenCalledWith('uploads/abc-document.pdf');
  });

  it('should delete the file from the database', async () => {
    // GIVEN
    const fileId = 3;
    const userId = 1;

    const file = {
      id: 3,
      storageKey: 'uploads/abc-document.pdf',
      userId: 1,
    };

    prismaService.file.findUnique.mockResolvedValue(file);
    prismaService.file.delete.mockResolvedValue(file);

    // WHEN
    await service.deleteFileById(fileId, userId);

    // THEN
    expect(prismaService.file.delete).toHaveBeenCalledWith({
      where: {
        id: 3,
      },
    });
  });

  it('should throw NotFoundException if the file does not belong to the user when delete a file', async () => {
    // GIVEN
    const fileId = 3;
    const userId = 2;

    prismaService.file.findUnique.mockResolvedValue(null);

    // WHEN
    await expect(service.deleteFileById(fileId, userId),).rejects.toThrow(NotFoundException);

    // THEN
    expect(prismaService.file.findUnique).toHaveBeenCalledWith({
      where: {
        id: 3,
        userId: 2,
      },
    });
    expect(storageService.deleteObject).not.toHaveBeenCalled();
    expect(prismaService.file.delete).not.toHaveBeenCalled();
  });

  it('should return download information for a valid download token', async () => {
    // GIVEN
    const file = {
      id: 1,
      originalName: 'document.pdf',
      storageKey: 'uploads/document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      uploadDate: new Date(),
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      downloadToken: 'valid-download-token',
      passwordHash: null,
      userId: 1,
    };

    prismaService.file.findUnique.mockResolvedValue(file);

    storageService.generateDownloadUrl.mockResolvedValue('http://localhost:9000/presigned-url');

    // WHEN
    const result = await service.getDownloadInfo('valid-download-token');

    // THEN
    expect(prismaService.file.findUnique).toHaveBeenCalledWith({
      where: {
        downloadToken: 'valid-download-token',
      },
    });

    expect(storageService.generateDownloadUrl).toHaveBeenCalledWith('uploads/document.pdf');

    expect(result).toEqual({
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      expirationDate: file.expirationDate,
      downloadUrl: 'http://localhost:9000/presigned-url',
      expiresIn: 900,
    });
  });

  it('should throw NotFoundException when the download token is invalid', async () => {
    // GIVEN
    prismaService.file.findUnique.mockResolvedValue(null);

    // WHEN
    await expect(service.getDownloadInfo('invalid-download-token')).rejects.toThrow(NotFoundException);

    // THEN
    expect(storageService.generateDownloadUrl).not.toHaveBeenCalled();
  });

  it('should throw GoneException when the file has expired', async () => {
    // GIVEN
    const expiredFile = {
      id: 1,
      originalName: 'document.pdf',
      storageKey: 'uploads/document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      uploadDate: new Date(),
      expirationDate: new Date(Date.now() - 1000),
      downloadToken: 'expired-download-token',
      passwordHash: null,
      userId: 1,
    };

    prismaService.file.findUnique.mockResolvedValue(expiredFile);

    // WHEN 
    await expect(service.getDownloadInfo('expired-download-token')).rejects.toThrow(GoneException);
    // THEN
    expect(storageService.generateDownloadUrl).not.toHaveBeenCalled();
  });

  it('should delete expired files', async () => {
    // GIVEN
    const expiredFile = {
      id: 3,
      storageKey: 'uploads/expired-document.pdf',
      userId: 1,
      expirationDate: new Date(Date.now() - 1000),
    };

    prismaService.file.findMany.mockResolvedValue([expiredFile]);
    prismaService.file.findUnique.mockResolvedValue(expiredFile);

    // WHEN
    await service.deleteExpiredFiles();

    // THEN
    expect(prismaService.file.findMany).toHaveBeenCalledWith({
      where: {
        expirationDate: {
          lte: expect.any(Date),
        },
      },
    });

    expect(prismaService.file.findUnique).toHaveBeenCalledWith({
      where: {
        id: 3,
        userId: 1,
      },
    });

    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'uploads/expired-document.pdf',
    );

    expect(prismaService.file.delete).toHaveBeenCalledWith({
      where: {
        id: 3,
      },
    });
  });

  it('should not delete files when none are expired', async () => {
    // GIVEN
    prismaService.file.findMany.mockResolvedValue([]);

    // WHEN
    await service.deleteExpiredFiles();

    // THEN
    expect(prismaService.file.findMany).toHaveBeenCalledWith({
      where: {
        expirationDate: {
          lte: expect.any(Date),
        },
      },
    });

    expect(prismaService.file.findUnique).not.toHaveBeenCalled();
    expect(storageService.deleteObject).not.toHaveBeenCalled();
    expect(prismaService.file.delete).not.toHaveBeenCalled();
  });
});
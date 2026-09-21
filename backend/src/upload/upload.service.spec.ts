import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service.js';
import { StorageService } from '../storage/storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UploadService', () => {
  let service: UploadService;
  let prismaService: {
    uploadSession: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    file: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  let storageService: {
    generateUploadUrl: ReturnType<typeof vi.fn>;
    headObject: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prismaService = {
      uploadSession: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      file: {
        create: vi.fn(),
      },
    };
    prismaService.uploadSession.create.mockImplementation(async ({ data }) => ({
      id: 1,
      ...data,
      createdAt: new Date(),
      expiresAt: new Date(),
      userId: 1,
    }));

    storageService = {
      generateUploadUrl: vi.fn(),
      headObject: vi.fn(),
    };

    storageService.generateUploadUrl.mockResolvedValue(
      'https://example.com/upload',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: StorageService,
          useValue: storageService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    
    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a unique storage key', async () => {
    // GIVEN : un utilisateur authentifié demande l'upload d'un fichier
    const createUploadDto = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    // WHEN : le service initialise l'upload
    const result = await service.createUpload(createUploadDto, 1);

    // THEN : une clé de stockage doit être générée
    expect(result.storageKey).toMatch(/^uploads\/.+\.pdf$/);
  });

  it('should calculate the upload session expiration date', async () => {
    // GIVEN : un utilisateur demande un upload valable 7 jours
    const createUploadDto = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    const before = new Date();

    // WHEN : le service initialise l'upload
    await service.createUpload(createUploadDto, 1);

    const after = new Date();

    // THEN : Prisma doit recevoir une date d'expiration dans 7 jours
    const createCall =
      prismaService.uploadSession.create.mock.calls[0][0];

    const expiresAt = createCall.data.expiresAt;

    const expectedMin = new Date(before);
    expectedMin.setMinutes(expectedMin.getMinutes() + 15);

    const expectedMax = new Date(after);
    expectedMax.setMinutes(expectedMax.getMinutes() + 15);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());

    expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
  });

  it('should create an upload session in database', async () => {
    // GIVEN : un utilisateur authentifié demande l'upload d'un fichier
    const createUploadDto = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    // WHEN : le service initialise l'upload
    await service.createUpload(createUploadDto, 1);

    // THEN : une session doit être créée en base
    expect(prismaService.uploadSession.create).toHaveBeenCalled();
  });

  it('should generate a presigned upload URL', async () => {
    // GIVEN : un utilisateur authentifié demande l'upload d'un fichier
    const createUploadDto = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    // WHEN : le service initialise l'upload
    const result = await service.createUpload(createUploadDto, 1);

    // THEN : une URL presignée doit être générée
    expect(storageService.generateUploadUrl).toHaveBeenCalledWith(result.storageKey, createUploadDto.mimeType);

    // THEN : cette URL doit être retournée au client
    expect(result.uploadUrl).toBe('https://example.com/upload');
    // THEN : la durée de validité de l'URL doit être de 15 minutes
    expect(result.expiresIn).toBe(900);
  });

  it('should create a file when an upload is completed', async () => {
    // GIVEN : une session d'upload existe pour l'utilisateur
    const uploadSession = {
      id: 1,
      originalName: 'document.pdf',
      storageKey: 'uploads/test-document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      expirationDays: 7,
      passwordHash: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      userId: 1,
    };

    prismaService.uploadSession.findUnique = vi.fn().mockResolvedValue(uploadSession)

    // AND : le fichier existe bien dans le stockage
    storageService.headObject = vi.fn().mockResolvedValue({
      ContentLength: 1024,
    });
    const before = new Date();

    // AND : Prisma pourra créer le fichier
    prismaService.file.create.mockImplementation(async ({ data }) => ({
      id: 1,
      ...data,
      uploadDate: new Date(),
    }));
    
    // WHEN : l'utilisateur finalise son upload
    const result = await service.completeUpload(1, 1);
    const after = new Date();

    // THEN : un fichier doit être créé en base
    expect(prismaService.file.create).toHaveBeenCalled();

    // THEN : la session temporaire doit être supprimée
    expect(prismaService.uploadSession.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        fileName: 'document.pdf',
        size: 1024,
      }),
    );

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + uploadSession.expirationDays);

    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + uploadSession.expirationDays);

    expect(result.expirationDate.getTime()).toBeGreaterThanOrEqual(
      expectedMin.getTime(),
    );

    expect(result.expirationDate.getTime()).toBeLessThanOrEqual(
      expectedMax.getTime(),
    );
  });

  it('should only complete an upload owned by the user', async () => {
    // GIVEN : une session d'upload appartient à un autre utilisateur
    prismaService.uploadSession.findUnique = vi.fn().mockResolvedValue(null);
    // AND : la session doit être recherchée avec l'ID de l'utilisateur
    prismaService.uploadSession.findUnique.mockResolvedValue(null);

    // WHEN : un utilisateur tente de finaliser cette session
    await expect(
      service.completeUpload(1, 2),
    ).rejects.toThrow(NotFoundException);

    // THEN : aucun fichier ne doit être créé
    expect(prismaService.file.create).not.toHaveBeenCalled();
    // THEN : la recherche doit être limitée à l'utilisateur connecté
    expect(prismaService.uploadSession.findUnique,).toHaveBeenCalledWith({
      where: {
        id: 1,
        userId: 2,
      },
    });
  });

  it('should reject an upload when the actual file size does not match the declared size', async () => {
    // GIVEN : une session d'upload annonce un fichier de 1024 octets
    const uploadSession = {
      id: 1,
      originalName: 'document.pdf',
      storageKey: 'uploads/test-document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      expirationDays: 7,
      passwordHash: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      userId: 1,
    };

    prismaService.uploadSession.findUnique.mockResolvedValue(uploadSession);

    // AND : le fichier réellement présent dans le stockage fait 2048 octets
    storageService.headObject.mockResolvedValue({
      ContentLength: 2048,
    });

    // WHEN : l'utilisateur tente de finaliser l'upload
    // THEN : la finalisation doit être refusée
    await expect(
      service.completeUpload(1, 1),
    ).rejects.toThrow(BadRequestException);

    // THEN : aucun fichier ne doit être créé en base
    expect(prismaService.file.create).not.toHaveBeenCalled();
  });

  it('should reject an expired upload session', async () => {
    // GIVEN : une session d'upload expirée
    const uploadSession = {
      id: 1,
      originalName: 'document.pdf',
      storageKey: 'uploads/test-document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      expirationDays: 7,
      passwordHash: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      expiresAt: new Date(Date.now() - 15 * 60 * 1000),
      userId: 1,
    };

    prismaService.uploadSession.findUnique.mockResolvedValue(uploadSession);

    // WHEN : l'utilisateur tente de finaliser une session expirée
    await expect(
      service.completeUpload(1, 1),
    ).rejects.toThrow(BadRequestException);

    // THEN : aucun fichier ne doit être créé
    expect(prismaService.file.create).not.toHaveBeenCalled();

    // THEN : aucun accès au stockage ne doit être effectué
    expect(storageService.headObject).not.toHaveBeenCalled();
  });
});

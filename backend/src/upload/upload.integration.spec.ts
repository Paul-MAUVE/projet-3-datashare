import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { StorageService } from '../storage/storage.service.js';
import { UploadService } from './upload.service.js';

describe('UploadService - integration', () => {  
  type StorageServiceMock = {
    generateUploadUrl: ReturnType<
        typeof vi.fn<(storageKey: string, mimeType: string) => Promise<string>>
    >;
    headObject: ReturnType<
        typeof vi.fn<
        (storageKey: string) => Promise<{ ContentLength?: number }>
        >
    >;
  };

  let prisma: PrismaClient;
  let service: UploadService;
  let storageService: StorageServiceMock;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes('datashare_test')) {
      throw new Error(
        'DATABASE_URL must point to the datashare_test database for integration tests',
      );
    }

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    prisma = new PrismaClient({ adapter });

    storageService = {
      generateUploadUrl: vi.fn().mockResolvedValue(
        'https://example.com/upload',
      ),
      headObject: vi.fn(),
    };

    service = new UploadService(
      storageService as unknown as StorageService,
      prisma,
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  afterEach(async () => {
    await prisma.file.deleteMany({
      where: {
        originalName: 'integration-test.pdf',
      },
    });

    await prisma.uploadSession.deleteMany({
      where: {
        originalName: 'integration-test.pdf',
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: 'integration-test@datashare.local',
      },
    });
  });

  it('should create an upload session in PostgreSQL', async () => {
    // GIVEN
    const user = await prisma.user.create({
      data: {
        email: 'integration-test@datashare.local',
        passwordHash: 'test-hash',
      },
    });

    const createUploadDto = {
      fileName: 'integration-test.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    // WHEN
    const result = await service.createUpload(createUploadDto, user.id);

    // THEN
    expect(result.uploadId).toBeTypeOf('number');
    expect(result.storageKey).toMatch(
      /^uploads\/.+-integration-test\.pdf$/,
    );
    expect(result.uploadUrl).toBe('https://example.com/upload');
    expect(result.expiresIn).toBe(900);

    const uploadSession = await prisma.uploadSession.findUnique({
      where: {
        id: result.uploadId,
      },
    });

    expect(uploadSession).not.toBeNull();
    expect(uploadSession).toEqual(
      expect.objectContaining({
        id: result.uploadId,
        originalName: 'integration-test.pdf',
        mimeType: 'application/pdf',
        size: BigInt(1024),
        expirationDays: 7,
        userId: user.id,
      }),
    );

    expect(storageService.generateUploadUrl).toHaveBeenCalledWith(
      result.storageKey,
      createUploadDto.mimeType,
    );
  });

  it('should complete an upload and persist the file in PostgreSQL', async () => {
    // GIVEN
    const user = await prisma.user.create({
      data: {
        email: 'integration-test@datashare.local',
        passwordHash: 'test-hash',
      },
    });

    const uploadSession = await prisma.uploadSession.create({
      data: {
        originalName: 'integration-test.pdf',
        storageKey: 'uploads/integration-test.pdf',
        mimeType: 'application/pdf',
        size: BigInt(1024),
        expirationDays: 7,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userId: user.id,
      },
    });

    vi.mocked(storageService.headObject).mockResolvedValue({
      ContentLength: 1024,
    });

    // WHEN
    const result = await service.completeUpload(
      uploadSession.id,
      user.id,
    );

    // THEN
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        fileName: 'integration-test.pdf',
        size: 1024,
        downloadUrl: expect.stringMatching(
          /^\/api\/download\/.+$/,
        ),
      }),
    );

    const file = await prisma.file.findUnique({
      where: {
        id: result.id,
      },
    });

    expect(file).not.toBeNull();
    expect(file).toEqual(
      expect.objectContaining({
        id: result.id,
        originalName: 'integration-test.pdf',
        storageKey: 'uploads/integration-test.pdf',
        mimeType: 'application/pdf',
        size: BigInt(1024),
        userId: user.id,
      }),
    );

    const deletedSession = await prisma.uploadSession.findUnique({
      where: {
        id: uploadSession.id,
      },
    });

    expect(deletedSession).toBeNull();

    expect(storageService.headObject).toHaveBeenCalledWith(
      'uploads/integration-test.pdf',
    );
  });

  it('should reject an upload when the storage size does not match the declared size', async () => {
    // GIVEN
    const user = await prisma.user.create({
      data: {
        email: 'integration-test@datashare.local',
        passwordHash: 'test-hash',
      },
    });

    const uploadSession = await prisma.uploadSession.create({
      data: {
        originalName: 'integration-test.pdf',
        storageKey: 'uploads/integration-test.pdf',
        mimeType: 'application/pdf',
        size: BigInt(1024),
        expirationDays: 7,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userId: user.id,
      },
    });

    vi.mocked(storageService.headObject).mockResolvedValue({
      ContentLength: 2048,
    });

    // WHEN / THEN
    await expect(
      service.completeUpload(uploadSession.id, user.id),
    ).rejects.toThrow('File size does not match the declared size');

    const file = await prisma.file.findFirst({
      where: {
        originalName: 'integration-test.pdf',
        userId: user.id,
      },
    });

    expect(file).toBeNull();

    const session = await prisma.uploadSession.findUnique({
      where: {
        id: uploadSession.id,
      },
    });

    expect(session).not.toBeNull();
  });
});
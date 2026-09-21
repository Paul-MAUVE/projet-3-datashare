import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

describe('FilesController', () => {
  let controller: FilesController;

  let filesService: {
    findAllByUser: ReturnType<typeof vi.fn>;
    deleteFileById: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    filesService = {
      findAllByUser: vi.fn(),
      deleteFileById: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: filesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return files belonging to the authenticated user', async () => {
    // GIVEN
    const request = {
      user: {
        userId: 1,
      },
    };

    const files = [
      {
        id: 3,
        fileName: 'document.pdf',
        size: 8961,
        uploadDate: new Date('2026-09-21T09:17:03.526Z'),
        expirationDate: new Date('2026-09-28T09:17:03.526Z'),
      },
    ];

    filesService.findAllByUser.mockResolvedValue(files);

    // WHEN
    const result = await controller.findAll(request);

    // THEN
    expect(filesService.findAllByUser).toHaveBeenCalledWith(1);
    expect(result).toEqual(files);
  });

  it('should be protected by JwtAuthGuard', () => {
    // GIVEN
    // WHEN
    // THEN
    expect(
      Reflect.getMetadata('__guards__', FilesController),
    ).toBeDefined();
  });

  it('should delete a file belonging to the authenticated user', async () => {
    // GIVEN
    const request = {
      user: {
        userId: 1,
      },
    };

    const fileId = '3';

    // WHEN
    await controller.remove(fileId, request);

    // THEN
    expect(filesService.deleteFileById).toHaveBeenCalledWith(3, 1);
  });
});
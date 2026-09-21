import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

describe('UploadController', () => {
  let controller: UploadController;

  const uploadService = {
    createUpload: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UploadService,
          useValue: uploadService,
        },
      ],
      controllers: [UploadController],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an upload', async () => {
    // GIVEN : UploadService retourne une session d'upload
    uploadService.createUpload.mockResolvedValue({
      uploadId: 1,
      uploadUrl: 'https://example.com/upload',
      expiresIn: 900,
    });

    const createUploadDto = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };
    const request = {
      user: {
        userId: 1,
      },
    };
    
    // WHEN : le contrôleur reçoit la demande d'upload
    const result = await controller.createUpload(createUploadDto, request);

    // THEN : le DTO doit être transmis au service
    expect(uploadService.createUpload).toHaveBeenCalledWith(createUploadDto, 1);

    // THEN : le résultat du service doit être retourné
    expect(result).toEqual({
      uploadId: 1,
      uploadUrl: 'https://example.com/upload',
      expiresIn: 900,
    });
  });
});

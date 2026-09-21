import { Test, TestingModule } from '@nestjs/testing';
import { DownloadController } from './download.controller.js';
import { FilesService } from '../files/files.service.js';

describe('DownloadController', () => {
  let controller: DownloadController;

  let filesService: {
    getDownloadInfo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    filesService = {
      getDownloadInfo: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadController],
      providers: [
        {
          provide: FilesService,
          useValue: filesService,
        },
      ],
    }).compile();

    controller = module.get<DownloadController>(DownloadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return download information for a valid download token', async () => {
    // GIVEN
    const downloadToken = 'valid-download-token';

    const downloadInfo = {
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      expirationDate: new Date('2026-09-28T09:17:03.526Z'),
      downloadUrl: 'http://localhost:9000/presigned-url',
      expiresIn: 900,
    };

    filesService.getDownloadInfo.mockResolvedValue(downloadInfo);

    // WHEN
    const result = await controller.getDownloadInfo(downloadToken);

    // THEN
    expect(filesService.getDownloadInfo).toHaveBeenCalledWith(downloadToken);
    expect(result).toEqual(downloadInfo);
  });
});
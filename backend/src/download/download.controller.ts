import { Controller, Get, Param } from '@nestjs/common';
import { FilesService } from '../files/files.service.js';

@Controller('download')
export class DownloadController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':downloadToken')
  async getDownloadInfo(@Param('downloadToken') downloadToken: string) {
    return this.filesService.getDownloadInfo(downloadToken);
  }
}
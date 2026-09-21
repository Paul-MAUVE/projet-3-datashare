import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller.js';
import { FilesModule } from '../files/files.module.js';

@Module({
  imports: [FilesModule],
  controllers: [DownloadController],
})
export class DownloadModule {}
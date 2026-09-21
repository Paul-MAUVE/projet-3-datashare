import { Module } from '@nestjs/common';
import { UploadService } from './upload.service.js';
import { UploadController } from './upload.controller.js';
import { StorageModule } from '../storage/storage.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [StorageModule, PrismaModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
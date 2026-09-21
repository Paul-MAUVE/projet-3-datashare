import { Module } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { FilesController } from './files.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  providers: [FilesService],
  controllers: [FilesController],
  imports: [PrismaModule],
})
export class FilesModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class FilesService {
  constructor(private readonly prismaService: PrismaService, private readonly storageService: StorageService) {}

  async findAllByUser(userId: number) {
    const files = await this.prismaService.file.findMany({
      where: {
        userId,
      },
    });

    return files.map((file) => ({
      id: file.id,
      fileName: file.originalName,
      size: Number(file.size),
      uploadDate: file.uploadDate,
      expirationDate: file.expirationDate,
    }));
  }

  async deleteFileById(fileId: number, userId: number) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }
    await this.storageService.deleteObject(file.storageKey);

    await this.prismaService.file.delete({
      where: {
        id: file.id,
      },
    });
  }
}
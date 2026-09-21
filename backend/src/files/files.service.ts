import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FilesService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
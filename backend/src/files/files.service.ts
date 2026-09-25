import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { Cron } from '@nestjs/schedule';

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
      downloadUrl: `/api/download/${file.downloadToken}`,
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

  async getDownloadInfo(downloadToken: string) {
    const file = await this.prismaService.file.findUnique({
      where: {
        downloadToken,
      },
    });

    if (!file) {
      throw new NotFoundException('Download link not found');
    }

    if (file.expirationDate <= new Date()) {
      throw new GoneException('Download link has expired');
    }

    const downloadUrl = await this.storageService.generateDownloadUrl(file.storageKey);

    return {
      fileName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      expirationDate: file.expirationDate,
      downloadUrl,
      expiresIn: 900,
    };
  }

  @Cron('0 0 * * *') // Tous les jours à minuit
  async deleteExpiredFiles() {
    const expiredFiles = await this.prismaService.file.findMany({
      where: {
        expirationDate: { lte: new Date() },
      },
    });

    for (const file of expiredFiles) {
      try {
        await this.deleteFileById(file.id, file.userId);
        console.log(`Fichier expiré supprimé : ${file.id}`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Erreur lors de la suppression du fichier ${file.id} :`, error.message);
        } else {
          console.error(`Erreur inconnue lors de la suppression du fichier ${file.id}`);
        }
      }
    }
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUploadDto } from './dto/create-upload.dto.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService, private readonly prismaService: PrismaService,) {}

  async createUpload(createUploadDto: CreateUploadDto, userId: number) {
    const storageKey = `uploads/${randomUUID()}-${createUploadDto.fileName}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const uploadSession = await this.prismaService.uploadSession.create({
      data: {
        originalName: createUploadDto.fileName,
        storageKey,
        mimeType: createUploadDto.mimeType,
        size: BigInt(createUploadDto.size),
        expirationDays: createUploadDto.expirationDays,
        expiresAt,
        userId,
      },
    });

    const uploadUrl = await this.storageService.generateUploadUrl(
      storageKey,
      createUploadDto.mimeType,
    );

    return {
      uploadId: uploadSession.id,
      storageKey: uploadSession.storageKey,
      expiresAt: uploadSession.expiresAt,
      uploadUrl,
      expiresIn: 900,
    };
  }

  async completeUpload(uploadId: number, userId: number) {
    const uploadSession =
      await this.prismaService.uploadSession.findUnique({
        where: {
          id: uploadId,
          userId: userId,
        }
      });
    
    if (!uploadSession) {
      throw new NotFoundException('Upload session not found');
    }
    if (uploadSession.expiresAt <= new Date()) {
      throw new BadRequestException('Upload session has expired');
    }

    const metadata = await this.storageService.headObject(uploadSession.storageKey);

    if (metadata.ContentLength !== Number(uploadSession.size)) {
      throw new BadRequestException('File size does not match the declared size');
    }

    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + uploadSession.expirationDays,
    );
    const file = await this.prismaService.file.create({
      data: {
        originalName: uploadSession.originalName,
        storageKey: uploadSession.storageKey,
        mimeType: uploadSession.mimeType,
        size: BigInt(metadata.ContentLength!),
        expirationDate,
        downloadToken: randomUUID(),
        passwordHash: uploadSession.passwordHash,
        userId,
      },
    });

    await this.prismaService.uploadSession.delete({
      where: {
        id: uploadSession.id,
      },
    });

    return {
      id: file.id,
      fileName: file.originalName,
      size: Number(file.size),
      expirationDate: file.expirationDate,
      downloadUrl: `/api/download/${file.downloadToken}`,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, HeadBucketCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async testConnection(): Promise<void> {
    await this.s3Client.send(
        new HeadBucketCommand({
        Bucket: process.env.S3_BUCKET,
        }),
    );
  }

  async uploadObject(storageKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3Client.send(
        new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
        }),
    );
  }

  async headObject(storageKey: string) {
    return this.s3Client.send(
        new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        }),
    );
  }

  async deleteObject(storageKey: string) {
    await this.s3Client.send(
        new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        }),
    );
  }

  async generateUploadUrl(storageKey: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
    });
  }

  async generateDownloadUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });
  }
}
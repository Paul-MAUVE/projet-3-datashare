export interface UploadRequest {
  fileName: string;
  size: number;
  mimeType: string;
  expirationDays: number;
}
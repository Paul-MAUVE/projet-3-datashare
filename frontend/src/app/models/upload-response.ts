export interface UploadResponse {
  uploadId: number;
  storageKey: string;
  expiresAt: string;
  uploadUrl: string;
  expiresIn: number;
}
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { File } from '../models/file';

@Service()
export class Files {
  private readonly http = inject(HttpClient);

  getFiles() {
    return this.http.get<File[]>('http://localhost:3000/api/files');
  }

  deleteFile(id: number) {
    return this.http.delete(
        `http://localhost:3000/api/files/${id}`
    );
  }

  getDownloadInfo(downloadUrl: string) {
    return this.http.get<{
        fileName: string;
        mimeType: string;
        size: number;
        expirationDate: string;
        downloadUrl: string;
        expiresIn: number;
    }>(`http://localhost:3000${downloadUrl}`);
    }
}
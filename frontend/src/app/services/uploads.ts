import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { UploadRequest } from '../models/upload-request';
import { UploadResponse } from '../models/upload-response';
import { UploadResult } from '../models/upload-result';

@Service()
export class Uploads {
  private readonly http = inject(HttpClient);

    createUpload(upload: UploadRequest) {
        return this.http.post<UploadResponse>(
        'http://localhost:3000/api/uploads',
        upload
        );
    }

    uploadFile(uploadUrl: string, file: File) {
        return this.http.put(uploadUrl, file, {
            headers: {
            'Content-Type': file.type,
            },
            responseType: 'text',
        });
    }
    completeUpload(uploadId: number) {
        return this.http.post<UploadResult>(
            `http://localhost:3000/api/uploads/${uploadId}/complete`,
            {}
        );
    }
}
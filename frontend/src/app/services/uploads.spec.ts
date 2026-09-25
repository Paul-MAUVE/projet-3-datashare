import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Uploads } from '../services/uploads';

describe('Uploads', () => {
  let service: Uploads;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(Uploads);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an upload session', () => {
    const upload = {
      fileName: 'document.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      expirationDays: 7,
    };

    const mockResponse = {
      uploadId: 1,
      storageKey: 'uploads/test-document.pdf',
      expiresAt: '2026-09-25T10:00:00.000Z',
      uploadUrl: 'http://localhost:9000/presigned-upload-url',
      expiresIn: 900,
    };

    service.createUpload(upload).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const request = httpTesting.expectOne('http://localhost:3000/api/uploads');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(upload);

    request.flush(mockResponse);
  });

  it('should upload the file to the presigned URL', () => {
    const file = new File(['contenu du fichier'], 'document.pdf', {
      type: 'application/pdf',
    });

    service
      .uploadFile('http://localhost:9000/presigned-upload-url', file)
      .subscribe();

    const request = httpTesting.expectOne('http://localhost:9000/presigned-upload-url');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBe(file);
    expect(request.request.headers.get('Content-Type')).toBe('application/pdf');

    request.flush('');
  });

  it('should complete the upload', () => {
    const mockResponse = {
      id: 1,
      fileName: 'document.pdf',
      size: 1024,
      expirationDate: '2026-10-02T00:00:00.000Z',
      downloadUrl: '/api/download/test-token',
    };

    service.completeUpload(1).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const request = httpTesting.expectOne('http://localhost:3000/api/uploads/1/complete');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush(mockResponse);
  });
});
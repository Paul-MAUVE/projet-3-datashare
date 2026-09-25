import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Files } from './files';

describe('Files', () => {
  let service: Files;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(Files);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get the user files', () => {
    const mockFiles = [
      {
        id: 1,
        fileName: 'document.pdf',
        size: 1024,
        expirationDate: '2026-10-01T00:00:00.000Z',
        downloadUrl: '/api/download/test-token',
      },
    ];

    service.getFiles().subscribe((files) => {
      expect(files).toEqual(mockFiles);
    });

    const request = httpTesting.expectOne('http://localhost:3000/api/files');

    expect(request.request.method).toBe('GET');

    request.flush(mockFiles);
  });

  it('should delete a file', () => {
    service.deleteFile(42).subscribe();

    const request = httpTesting.expectOne('http://localhost:3000/api/files/42');

    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });

  it('should get download information', () => {
    const mockDownloadInfo = {
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      expirationDate: '2026-10-01T00:00:00.000Z',
      downloadUrl: 'http://localhost:9000/presigned-url',
      expiresIn: 900,
    };

    service.getDownloadInfo('/api/download/test-token').subscribe((file) => {
      expect(file).toEqual(mockDownloadInfo);
    });

    const request = httpTesting.expectOne('http://localhost:3000/api/download/test-token');

    expect(request.request.method).toBe('GET');

    request.flush(mockDownloadInfo);
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Upload } from './upload';
import { Uploads } from '../../services/uploads';
import type { UploadRequest } from '../../models/upload-request';
import type { UploadResponse } from '../../models/upload-response';
import type { UploadResult } from '../../models/upload-result';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('Upload', () => {
  let component: Upload;
  let fixture: ComponentFixture<Upload>;

  const uploadsMock = {
    createUpload: vi.fn(
      (upload: UploadRequest) =>
        of({
          uploadId: 1,
          storageKey: 'uploads/test-document.pdf',
          expiresAt: '2099-01-01T00:15:00.000Z',
          uploadUrl: 'http://localhost:9000/presigned-upload-url',
          expiresIn: 900,
        } satisfies UploadResponse)
    ),

    uploadFile: vi.fn(
      (uploadUrl: string, file: File) => of('')
    ),

    completeUpload: vi.fn(
      (uploadId: number) =>
        of({
          id: 1,
          fileName: 'document.pdf',
          size: 1024,
          expirationDate: '2099-01-01T00:00:00.000Z',
          downloadUrl: '/api/download/test-token',
        } satisfies UploadResult)
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [Upload],
    providers: [
      provideRouter([]),
      {
        provide: Uploads,
        useValue: uploadsMock,
      },
    ],
  }).compileComponents();

    fixture = TestBed.createComponent(Upload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect when a selected file is too large', () => {
    const largeFile = new File(
      ['contenu'],
      'large-file.pdf',
      { type: 'application/pdf' }
    );

    Object.defineProperty(largeFile, 'size', {
      value: 1073741825,
    });

    const input = document.createElement('input');
    input.type = 'file';

    Object.defineProperty(input, 'files', {
      value: [largeFile],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(largeFile);
    expect(component.fileTooLarge).toBe(true);
  });

  it('should accept a file within the size limit', () => {
    const file = new File(
      ['contenu'],
      'document.pdf',
      { type: 'application/pdf' }
    );

    const input = document.createElement('input');
    input.type = 'file';

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    const event = {
      target: input,
    } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(file);
    expect(component.fileTooLarge).toBe(false);
  });

  it('should format file sizes', () => {
    expect(component.formatFileSize(500)).toBe('500 o');
    expect(component.formatFileSize(2048)).toBe('2,0 Ko');
    expect(component.formatFileSize(2 * 1024 * 1024)).toBe('2,0 Mo');
  });

  it('should calculate remaining days before expiration', () => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const daysRemaining = component.getDaysRemaining(
      tomorrow.toISOString()
    );

    expect(daysRemaining).toBe(1);
  });

  it('should return the public download link', () => {
    component.uploadResult = {
      id: 1,
      fileName: 'document.pdf',
      size: 1024,
      expirationDate: '2099-01-01T00:00:00.000Z',
      downloadUrl: '/api/download/test-token',
    };

    expect(component.getDownloadLink()).toBe(`${window.location.origin}/download/test-token`);
  });

  it('should complete the upload workflow', () => {
    const file = new File(
      ['contenu du fichier'],
      'document.pdf',
      { type: 'application/pdf' }
    );

    component.selectedFile = file;
    component.expirationDays = 7;

    const uploadResult = {
      id: 1,
      fileName: 'document.pdf',
      size: file.size,
      expirationDate: '2099-01-01T00:00:00.000Z',
      downloadUrl: '/api/download/test-token',
    };

    uploadsMock.createUpload = vi.fn(() =>
      of({
        uploadId: 42,
        storageKey: 'uploads/test-document.pdf',
        expiresAt: '2099-01-01T00:15:00.000Z',
        uploadUrl: 'http://localhost:9000/presigned-upload-url',
        expiresIn: 900,
      })
    );

    uploadsMock.uploadFile = vi.fn(() => of(''));

    uploadsMock.completeUpload = vi.fn(() =>
      of(uploadResult)
    );

    component.createUpload();

    expect(uploadsMock.createUpload).toHaveBeenCalledWith({
      fileName: 'document.pdf',
      size: file.size,
      mimeType: 'application/pdf',
      expirationDays: 7,
    });

    expect(uploadsMock.uploadFile).toHaveBeenCalledWith(
      'http://localhost:9000/presigned-upload-url',
      file
    );

    expect(uploadsMock.completeUpload).toHaveBeenCalledWith(42);

    expect(component.uploadResult).toEqual(uploadResult);
  });
});
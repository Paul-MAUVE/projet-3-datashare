import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Download } from './download';
import { Files } from '../../services/files';
import { of } from 'rxjs';

describe('Download', () => {
  let component: Download;
  let fixture: ComponentFixture<Download>;

  const mockFile = {
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    expirationDate: '2099-01-01T00:00:00.000Z',
    downloadUrl: 'http://localhost:9000/presigned-download-url',
    expiresIn: 900,
  };

  const filesMock = {
    getDownloadInfo: vi.fn(() => of(mockFile)),
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Download],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-token',
              },
            },
          },
        },
        {
          provide: Files,
          useValue: filesMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Download);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the file information from the download token', () => {
    expect(filesMock.getDownloadInfo).toHaveBeenCalledWith('/api/download/test-token');

    expect(component.file()).toEqual(mockFile);
    expect(component.error()).toBe(false);
  });

  it('should format file sizes', () => {
    expect(component.formatFileSize(500)).toBe('500 o');
    expect(component.formatFileSize(2048)).toBe('2.0 Ko');
    expect(component.formatFileSize(2 * 1024 * 1024)).toBe('2.0 Mo');
  });

  it('should calculate remaining days before expiration', () => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const daysRemaining = component.getDaysRemaining(
      tomorrow.toISOString()
    );

    expect(daysRemaining).toBe(1);
  });

  it('should return safe expiration status when there are at least two days remaining', () => {
    const expirationDate = new Date();

    expirationDate.setDate(expirationDate.getDate() + 2);

    expect(component.getExpirationStatus(expirationDate.toISOString())).toBe('safe');
  });

  it('should return warning expiration status when one day remains', () => {
    const expirationDate = new Date();

    expirationDate.setDate(expirationDate.getDate() + 1);

    expect(component.getExpirationStatus(expirationDate.toISOString())).toBe('warning');
  });

  it('should return expired status when the file has expired', () => {
    const expirationDate = new Date();

    expirationDate.setDate(expirationDate.getDate() - 1);

    expect(component.getExpirationStatus(expirationDate.toISOString())).toBe('expired');
  });
});
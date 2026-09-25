import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySpace } from './my-space';
import { provideRouter } from '@angular/router';
import { Files } from '../../services/files';
import { Auth } from '../../services/auth';
import { of } from 'rxjs';

describe('MySpace', () => {
  let component: MySpace;
  let fixture: ComponentFixture<MySpace>;

  const mockFiles = [
    {
      id: 1,
      fileName: 'document-actif.pdf',
      size: 1024,
      expirationDate: '2099-01-01T00:00:00.000Z',
      downloadUrl: '/api/download/active-token',
    },
    {
      id: 2,
      fileName: 'document-expire.pdf',
      size: 2048,
      expirationDate: '2020-01-01T00:00:00.000Z',
      downloadUrl: '/api/download/expired-token',
    },
  ];

  const filesMock = {
    getFiles: () => of(mockFiles),
    deleteFile: () => of(null),
  };

  const authMock = {
    logout: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySpace],
      providers: [
        provideRouter([]),
        {
          provide: Files,
          useValue: filesMock,
        },
        {
          provide: Auth,
          useValue: authMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MySpace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the user files', () => {
    expect(component.filesList()).toEqual(mockFiles);
  });

  it('should return all files with the all filter', () => {
    component.selectedFilter.set('all');

    expect(component.getFilteredFiles()).toEqual(mockFiles);
  });

  it('should return only active files with the active filter', () => {
    component.selectedFilter.set('active');

    expect(component.getFilteredFiles()).toEqual([
      mockFiles[0],
    ]);
  });

  it('should return only expired files with the expired filter', () => {
    component.selectedFilter.set('expired');

    expect(component.getFilteredFiles()).toEqual([
      mockFiles[1],
    ]);
  });

  it('should extract the download token from the download URL', () => {
    const token = component.getDownloadToken(
      '/api/download/test-token'
    );

    expect(token).toBe('test-token');
  });

  it('should toggle the menu', () => {
    expect(component.menuOpen()).toBe(false);

    component.toggleMenu();

    expect(component.menuOpen()).toBe(true);

    component.toggleMenu();

    expect(component.menuOpen()).toBe(false);
  });

  it('should delete a file after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteFile(1);

    expect(component.filesList()).toEqual([
      mockFiles[1],
    ]);

    vi.restoreAllMocks();
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { authInterceptor } from './auth-interceptor';
import { of } from 'rxjs';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should not add Authorization when there is no token', () => {
    const request = new HttpRequest(
      'GET',
      'http://localhost:3000/api/files'
    );

    const next = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    };

    interceptor(request, next).subscribe();
  });

  it('should add Authorization for backend requests when a token exists', () => {
    localStorage.setItem('accessToken', 'test-token');

    const request = new HttpRequest(
      'GET',
      'http://localhost:3000/api/files'
    );

    const next = (req: HttpRequest<unknown>) => {
      expect(req.headers.get('Authorization')).toBe(
        'Bearer test-token'
      );
      return of(new HttpResponse({ status: 200 }));
    };

    interceptor(request, next).subscribe();
  });

  it('should not add Authorization to MinIO requests', () => {
    localStorage.setItem('accessToken', 'test-token');

    const request = new HttpRequest(
      'PUT',
      'http://localhost:9000/presigned-upload-url',
      null
    );

    const next = (req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    };
    interceptor(request, next).subscribe();
  });
});
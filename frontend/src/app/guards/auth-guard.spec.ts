import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() =>
      authGuard(...guardParameters)
    );

  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            parseUrl: (url: string) => url,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow access when an access token exists', () => {
    localStorage.setItem('accessToken', 'test-token');

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(true);
  });

  it('should redirect to login when no access token exists', () => {
    const result = executeGuard({} as never, {} as never);

    expect(result).toBe('/login');
  });
});
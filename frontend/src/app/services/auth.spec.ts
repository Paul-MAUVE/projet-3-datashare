import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('Auth', () => {
  let service: Auth;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Auth);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login a user', () => {
    // GIVEN
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const expectedResponse = {
      accessToken: 'fake-jwt-token'
    };

    // WHEN
    service.login(credentials).subscribe((response) => {
      // THEN
      expect(response).toEqual(expectedResponse);
    });

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/auth/login'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);

    request.flush(expectedResponse);
  });

  it('should store the access token in sessionStorage after login', () => {
    // GIVEN
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const expectedResponse = {
      accessToken: 'fake-jwt-token'
    };

    // WHEN
    service.login(credentials).subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/auth/login'
    );

    request.flush(expectedResponse);

    // THEN
    expect(sessionStorage.getItem('accessToken')).toBe('fake-jwt-token');
  });

  it('should not store an access token when login fails', () => {
    // GIVEN
    const credentials = {
      email: 'test@example.com',
      password: 'wrong-password'
    };

    // WHEN
    service.login(credentials).subscribe({
      error: () => {
        // THEN
        expect(sessionStorage.getItem('accessToken')).toBeNull();
      }
    });

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/auth/login'
    );

    request.flush(
      { message: 'Invalid credentials' },
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );
  });

  it('should remove the access token on logout', () => {
    // GIVEN
    sessionStorage.setItem('accessToken', 'fake-jwt-token');

    // WHEN
    service.logout();

    // THEN
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});

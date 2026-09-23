import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark the form as touched when submitted with invalid data', () => {
    // GIVEN
    expect(component.loginForm.invalid).toBe(true);

    // WHEN
    component.onSubmit();

    // THEN
    expect(component.email.touched).toBe(true);
    expect(component.password.touched).toBe(true);
    httpTesting.expectNone('http://localhost:3000/api/auth/login');
  });
  
  it('should login successfully and store the access token', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');

    sessionStorage.clear();

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    // THEN
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'test@example.com',
      password: '12345678'
    });

    request.flush({accessToken: 'fake-access-token'});

    expect(sessionStorage.getItem('accessToken')).toBe('fake-access-token');
  });

  it('should display an error when credentials are invalid', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');

    sessionStorage.clear();

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    request.flush({},
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    // THEN
    expect(component.errorMessage).toBe('Adresse e-mail ou mot de passe incorrect.');
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('should display a generic error when login fails', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');

    sessionStorage.clear();

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    request.flush({},
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );

    // THEN
    expect(component.errorMessage).toBe('Une erreur est survenue. Veuillez réessayer plus tard.');
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('should navigate to home after a successful login', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    request.flush({accessToken: 'fake-access-token'});

    // THEN
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});

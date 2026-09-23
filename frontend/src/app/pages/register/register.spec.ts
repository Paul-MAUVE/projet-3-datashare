import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
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
    expect(component.registerForm.invalid).toBe(true);

    // WHEN
    component.onSubmit();

    // THEN
    expect(component.email.touched).toBe(true);
    expect(component.password.touched).toBe(true);
    expect(component.confirmPassword.touched).toBe(true);
  });

  it('should invalidate the form when passwords do not match', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');
    component.confirmPassword.setValue('1234567');

    // WHEN
    component.registerForm.updateValueAndValidity();

    // THEN
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    expect(component.registerForm.invalid).toBe(true);
  });

  it('should validate the form when registration data is valid', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');
    component.confirmPassword.setValue('12345678');

    // WHEN
    component.registerForm.updateValueAndValidity();

    // THEN
    expect(component.registerForm.valid).toBe(true);
  });

  it('should register the user and navigate to login when registration succeeds', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');
    component.confirmPassword.setValue('12345678');

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    // WHEN
    component.onSubmit();

    // THEN
    const request = httpTesting.expectOne('http://localhost:3000/api/users');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'test@example.com',
      password: '12345678'
    });

    request.flush({
      id: 1,
      email: 'test@example.com',
      createdAt: '2026-09-22T14:50:58.474Z'
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should display an error when the email is already used', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');
    component.confirmPassword.setValue('12345678');

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/users');

    request.flush(
      {},
      {
        status: 409,
        statusText: 'Conflict'
      }
    );

    // THEN
    expect(component.errorMessage()).toBe('Cette adresse e-mail est déjà utilisée.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should display a generic error when registration fails', () => {
    // GIVEN
    component.email.setValue('test@example.com');
    component.password.setValue('12345678');
    component.confirmPassword.setValue('12345678');

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    // WHEN
    component.onSubmit();

    const request = httpTesting.expectOne('http://localhost:3000/api/users');

    request.flush(
      {},
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );

    // THEN
    expect(component.errorMessage()).toBe(
      'Une erreur est survenue. Veuillez réessayer plus tard.'
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

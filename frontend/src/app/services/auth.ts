import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { RegisterRequest } from '../models/register-request';
import { tap } from 'rxjs';

@Service()
export class Auth {
    private readonly http = inject(HttpClient);

    login(credentials: LoginRequest) {
        return this.http.post<LoginResponse>(
            'http://localhost:3000/api/auth/login',
            credentials
        )
        .pipe(
            tap((response) => {
                localStorage.setItem('accessToken', response.accessToken);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('accessToken');
    }

    register(credentials: RegisterRequest) {
        return this.http.post(
            'http://localhost:3000/api/users',
            credentials
        );
    }
}

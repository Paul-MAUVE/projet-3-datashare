import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Register } from './pages/register/register';
import { Upload } from './pages/upload/upload';
import { MySpace } from './pages/my-space/my-space';
import { Download } from './pages/download/download';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },
    { 
        path: 'my-space', 
        component: MySpace, 
        canActivate: [authGuard] 
    },
    { 
        path: 'upload', 
        component: Upload, 
        canActivate: [authGuard] 
    },
    {
        path: 'download/:downloadToken',
        component: Download
    },
];
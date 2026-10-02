import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './features/auth/presentation/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/presentation/pages/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'registro',
    canActivate: [authGuard],
    loadComponent: () => import('./features/registro/presentation/pages/registro-page/registro-page.component').then(m => m.RegistroPageComponent)
  },
  { path: '**', redirectTo: 'login' }
];

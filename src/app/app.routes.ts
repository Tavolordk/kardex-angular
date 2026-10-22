import { Routes } from '@angular/router';
import { authGuard, guestGuard, selectedProfileGuard, reviewedProfileGuard } from './features/auth/presentation/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/presentation/pages/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'validacion-inicial',
    canActivate: [authGuard],
    loadComponent: () => import('./features/flow/initial-validation-page.component').then(m => m.InitialValidationPageComponent)
  },
  {
    path: 'consulta',
    canActivate: [authGuard, reviewedProfileGuard],
    loadComponent: () => import('./features/flow/consulta-page.component').then(m => m.ConsultaPageComponent)
  },
  {
    path: 'menu',
    canActivate: [authGuard, selectedProfileGuard],
    loadComponent: () => import('./features/menu/presentation/pages/menu-page/menu-page.component').then(m => m.MenuPageComponent)
  },
  {
    path: 'registro',
    canActivate: [authGuard],
    loadComponent: () => import('./features/registro/presentation/pages/registro-page/registro-page.component').then(m => m.RegistroPageComponent)
  },
  {
    path: 'modulo/:modulo',
    canActivate: [authGuard, selectedProfileGuard],
    loadComponent: () => import('./features/expediente/presentation/pages/modulo-page/modulo-page.component').then(m => m.ModuloPageComponent)
  },
  { path: '**', redirectTo: 'login' }
];

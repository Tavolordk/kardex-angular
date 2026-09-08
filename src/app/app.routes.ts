import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'registro', pathMatch: 'full' },
  {
    path: 'registro',
    loadComponent: () => import('./features/registro/presentation/pages/registro-page/registro-page.component').then(m => m.RegistroPageComponent)
  },
  { path: '**', redirectTo: 'registro' }
];

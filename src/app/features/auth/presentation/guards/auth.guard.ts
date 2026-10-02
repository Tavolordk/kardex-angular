import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GetCurrentSessionUseCase } from '../../application/get-current-session.use-case';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(GetCurrentSessionUseCase).execute();
  if (session) return true;

  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(GetCurrentSessionUseCase).execute();
  return session ? inject(Router).createUrlTree(['/registro']) : true;
};

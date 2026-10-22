import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GetCurrentSessionUseCase } from '../../application/get-current-session.use-case';
import { KardexFlowService } from '../../../../core/navigation/kardex-flow.service';

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

/** No abrir los módulos sin elegir antes un perfil en Consulta. */
export const selectedProfileGuard: CanActivateFn = () => {
  const flow = inject(KardexFlowService);
  return flow.hasSelectedProfile()
    ? true
    : inject(Router).createUrlTree([flow.isValidated() ? '/consulta' : '/registro']);
};

/** El usuario primero termina Registro y confirma su revisión inicial. */
export const reviewedProfileGuard: CanActivateFn = () =>
  inject(KardexFlowService).isValidated()
    ? true : inject(Router).createUrlTree(['/validacion-inicial']);

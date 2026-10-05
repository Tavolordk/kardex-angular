import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { GetCurrentSessionUseCase } from './application/get-current-session.use-case';
import { RequestVerificationUseCase } from './application/request-verification.use-case';
import { SignOutUseCase } from './application/sign-out.use-case';
import { VerifyAccessCodeUseCase } from './application/verify-access-code.use-case';
import { AuthRepository } from './domain/repositories/auth.repository';
import { HttpAuthRepository } from './infrastructure/http-auth.repository';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    HttpAuthRepository,
    { provide: AuthRepository, useExisting: HttpAuthRepository },
    { provide: RequestVerificationUseCase, useFactory: (r: AuthRepository) => new RequestVerificationUseCase(r), deps: [AuthRepository] },
    { provide: VerifyAccessCodeUseCase, useFactory: (r: AuthRepository) => new VerifyAccessCodeUseCase(r), deps: [AuthRepository] },
    { provide: GetCurrentSessionUseCase, useFactory: (r: AuthRepository) => new GetCurrentSessionUseCase(r), deps: [AuthRepository] },
    { provide: SignOutUseCase, useFactory: (r: AuthRepository) => new SignOutUseCase(r), deps: [AuthRepository] }
  ]);
}

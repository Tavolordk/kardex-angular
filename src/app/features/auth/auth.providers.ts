import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { GetCurrentSessionUseCase } from './application/get-current-session.use-case';
import { RequestVerificationUseCase } from './application/request-verification.use-case';
import { SignOutUseCase } from './application/sign-out.use-case';
import { VerifyAccessCodeUseCase } from './application/verify-access-code.use-case';
import { AuthRepository } from './domain/repositories/auth.repository';
import { LocalStorageAuthRepository } from './infrastructure/local-storage-auth.repository';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    LocalStorageAuthRepository,
    { provide: AuthRepository, useExisting: LocalStorageAuthRepository },
    {
      provide: RequestVerificationUseCase,
      useFactory: (repository: AuthRepository) => new RequestVerificationUseCase(repository),
      deps: [AuthRepository]
    },
    {
      provide: VerifyAccessCodeUseCase,
      useFactory: (repository: AuthRepository) => new VerifyAccessCodeUseCase(repository),
      deps: [AuthRepository]
    },
    {
      provide: GetCurrentSessionUseCase,
      useFactory: (repository: AuthRepository) => new GetCurrentSessionUseCase(repository),
      deps: [AuthRepository]
    },
    {
      provide: SignOutUseCase,
      useFactory: (repository: AuthRepository) => new SignOutUseCase(repository),
      deps: [AuthRepository]
    }
  ]);
}

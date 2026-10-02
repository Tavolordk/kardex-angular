import { AuthRepository } from '../domain/repositories/auth.repository';

export class SignOutUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(): void {
    this.repository.clearSession();
  }
}

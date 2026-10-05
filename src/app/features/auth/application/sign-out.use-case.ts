import { AuthRepository } from '../domain/repositories/auth.repository';

export class SignOutUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(reason = 'Cerrar sesion'): Promise<void> {
    return this.repository.signOut(reason);
  }
}

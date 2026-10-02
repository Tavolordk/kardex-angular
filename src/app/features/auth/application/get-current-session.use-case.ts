import { AuthSession } from '../domain/models/auth.model';
import { AuthRepository } from '../domain/repositories/auth.repository';

export class GetCurrentSessionUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(): AuthSession | null {
    return this.repository.getSession();
  }
}

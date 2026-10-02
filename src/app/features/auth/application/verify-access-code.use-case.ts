import { AuthSession } from '../domain/models/auth.model';
import { AuthRepository } from '../domain/repositories/auth.repository';

export class VerifyAccessCodeUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(challengeId: string, code: string): Promise<AuthSession> {
    const normalizedCode = code.replace(/\D/g, '');
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new Error('Captura los seis dígitos del código de verificación.');
    }

    return this.repository.verifyCode(challengeId, normalizedCode);
  }
}

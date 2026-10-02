import { AccessCredentials, VerificationChallenge } from '../domain/models/auth.model';
import { AuthRepository } from '../domain/repositories/auth.repository';

export class RequestVerificationUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(credentials: AccessCredentials): Promise<VerificationChallenge> {
    const normalized: AccessCredentials = {
      email: credentials.email.trim().toLowerCase(),
      phone: credentials.phone.replace(/\D/g, ''),
      channel: credentials.channel
    };

    if (normalized.channel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
        throw new Error('Ingresa un correo electrónico válido.');
      }
    }

    if (normalized.channel === 'sms' || normalized.channel === 'telegram') {
      if (!/^\d{10}$/.test(normalized.phone)) {
        throw new Error('El número de celular debe contener 10 dígitos.');
      }
    }

    return this.repository.requestVerification(normalized);
  }
}

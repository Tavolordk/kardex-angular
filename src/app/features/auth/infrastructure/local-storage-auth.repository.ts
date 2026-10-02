import { Injectable } from '@angular/core';
import { AccessCredentials, AuthSession, VerificationChallenge } from '../domain/models/auth.model';
import { AuthRepository } from '../domain/repositories/auth.repository';

interface ActiveChallenge {
  challenge: VerificationChallenge;
  email: string;
  phone: string;
}

@Injectable()
export class LocalStorageAuthRepository implements AuthRepository {
  private readonly storageKey = 'kardex.auth.session.v1';
  private readonly demoCode = '481027';
  private activeChallenge: ActiveChallenge | null = null;

  async requestVerification(credentials: AccessCredentials): Promise<VerificationChallenge> {
    await this.delay(220);

    const ttlSeconds = 120;
    const challenge: VerificationChallenge = {
      id: this.createId(),
      channel: credentials.channel,
      destinationHint: this.maskDestination(credentials),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      ttlSeconds
    };

    this.activeChallenge = {
      challenge,
      email: credentials.email,
      phone: credentials.phone
    };

    return challenge;
  }

  async verifyCode(challengeId: string, code: string): Promise<AuthSession> {
    await this.delay(260);

    const current = this.activeChallenge;
    if (!current || current.challenge.id !== challengeId) {
      throw new Error('La solicitud de verificación ya no es válida. Solicita un nuevo código.');
    }

    if (Date.now() >= new Date(current.challenge.expiresAt).getTime()) {
      throw new Error('El código de verificación expiró. Solicita un nuevo envío.');
    }

    if (code !== this.demoCode) {
      throw new Error('El código de verificación no es correcto.');
    }

    const session: AuthSession = {
      userId: current.email || current.phone,
      displayName: this.displayNameFromEmail(current.email || current.phone),
      role: 'Administrador',
      accessToken: `local-${this.createId()}`,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    };

    this.writeSession(session);
    this.activeChallenge = null;
    return session;
  }

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (!session.expiresAt || Date.now() >= new Date(session.expiresAt).getTime()) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.storageKey);
    }
    this.activeChallenge = null;
  }

  private writeSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private maskDestination(credentials: AccessCredentials): string {
    if (credentials.channel === 'email') {
      const [localPart = '', domain = 'dominio.gob.mx'] = credentials.email.split('@');
      const visible = localPart.slice(0, 2);
      return `${visible}***@${domain}`;
    }

    const tail = credentials.phone.slice(-4);
    return `******${tail}`;
  }

  private displayNameFromEmail(emailOrPhone: string): string {
    const source = (emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : emailOrPhone) ?? 'usuario';
    return source
      .split(/[._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Usuario Kardex';
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }
}

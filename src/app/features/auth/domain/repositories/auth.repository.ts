import { AccessCredentials, AuthSession, VerificationChallenge } from '../models/auth.model';

export abstract class AuthRepository {
  abstract requestVerification(credentials: AccessCredentials): Promise<VerificationChallenge>;
  abstract verifyCode(challengeId: string, code: string): Promise<AuthSession>;
  abstract refreshSession(): Promise<AuthSession>;
  abstract signOut(reason?: string): Promise<void>;
  abstract getSession(): AuthSession | null;
  abstract clearSession(): void;
}

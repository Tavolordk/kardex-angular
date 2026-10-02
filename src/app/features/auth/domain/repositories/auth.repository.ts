import { AccessCredentials, AuthSession, VerificationChallenge } from '../models/auth.model';

export abstract class AuthRepository {
  abstract requestVerification(credentials: AccessCredentials): Promise<VerificationChallenge>;
  abstract verifyCode(challengeId: string, code: string): Promise<AuthSession>;
  abstract getSession(): AuthSession | null;
  abstract clearSession(): void;
}

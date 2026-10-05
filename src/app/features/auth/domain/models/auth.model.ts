export type VerificationChannel = 'telegram' | 'email' | 'sms';

export interface AccessCredentials {
  email: string;
  phone: string;
  channel: VerificationChannel;
}

export interface VerificationChallenge {
  id: string;
  channel: VerificationChannel;
  destinationHint: string;
  expiresAt: string;
  ttlSeconds: number;
  preAuthToken: string;
}

export interface AuthSession {
  userId: string;
  displayName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  sessionExpiresAt: string | null;
  sid: string | null;
}

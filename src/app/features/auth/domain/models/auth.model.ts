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
}

export interface AuthSession {
  userId: string;
  displayName: string;
  role: string;
  accessToken: string;
  expiresAt: string;
}

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccessCredentials, AuthSession, VerificationChallenge, VerificationChannel } from '../domain/models/auth.model';
import { AuthRepository } from '../domain/repositories/auth.repository';

interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

interface AccessTokenResponse {
  accessToken?: string | null;
  codigoEnviado: boolean;
  canal?: string | null;
}

interface SesionResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresIn: number;
  expiresAtUtc: string;
  sessionExpiresAtUtc?: string | null;
  sid?: string | null;
}

interface CierreResponse {
  cerrada: boolean;
  sid?: string | null;
}

interface ActiveChallenge {
  challenge: VerificationChallenge;
  email: string;
  phone: string;
}

@Injectable()
export class HttpAuthRepository implements AuthRepository {
  private readonly storageKey = 'kardex.auth.session.v1';
  private readonly loginBase = '/api/login/Login';
  private activeChallenge: ActiveChallenge | null = null;

  constructor(private readonly http: HttpClient) {}

  async requestVerification(credentials: AccessCredentials): Promise<VerificationChallenge> {
    const body = {
      correo: credentials.email,
      celular: credentials.phone,
      medioContacto: this.toApiChannel(credentials.channel)
    };

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<AccessTokenResponse>>(`${this.loginBase}/valida-user`, body)
      );
      const data = this.unwrap<AccessTokenResponse>(response, 'No fue posible validar las credenciales.');
      if (!data.accessToken) throw new Error('El servidor no devolvió el token de preautenticación.');
      if (!data.codigoEnviado) throw new Error(response.message || 'El código de verificación no pudo ser enviado.');

      const jwt = this.decodeJwt(data.accessToken);
      const expiresAt = this.jwtExpiration(data.accessToken) ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const ttlSeconds = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      const challenge: VerificationChallenge = {
        id: String(jwt?.['jti'] ?? data.accessToken),
        channel: this.fromApiChannel(data.canal) ?? credentials.channel,
        destinationHint: this.maskDestination(credentials, this.fromApiChannel(data.canal) ?? credentials.channel),
        expiresAt,
        ttlSeconds,
        preAuthToken: data.accessToken
      };
      this.activeChallenge = { challenge, email: credentials.email, phone: credentials.phone };
      return challenge;
    } catch (error) {
      throw new Error(this.errorMessage(error, 'No fue posible solicitar el código de verificación.'));
    }
  }

  async verifyCode(challengeId: string, code: string): Promise<AuthSession> {
    const current = this.activeChallenge;
    if (!current || current.challenge.id !== challengeId) {
      throw new Error('La solicitud de verificación ya no es válida. Solicita un nuevo código.');
    }

    const channel = current.challenge.channel;
    const body = {
      canal: this.toApiChannel(channel),
      contacto: channel === 'email' ? current.email : current.phone,
      codigo: code
    };
    const headers = new HttpHeaders({ Authorization: `Bearer ${current.challenge.preAuthToken}` });

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<SesionResponse>>(`${this.loginBase}/verificar-codigo`, body, { headers })
      );
      const data = this.unwrap<SesionResponse>(response, 'No fue posible verificar el código.');
      const session = this.toSession(data, current.email);
      this.writeSession(session);
      this.activeChallenge = null;
      return session;
    } catch (error) {
      throw new Error(this.errorMessage(error, 'No fue posible verificar el código.'));
    }
  }

  async refreshSession(): Promise<AuthSession> {
    const current = this.getStoredSession();
    if (!current?.refreshToken) throw new Error('No existe una sesión que pueda renovarse.');
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<SesionResponse>>(`${this.loginBase}/refrescar-token`, { refreshToken: current.refreshToken })
      );
      const data = this.unwrap<SesionResponse>(response, 'No fue posible renovar la sesión.');
      const session = this.toSession(data, current.userId || '');
      this.writeSession(session);
      return session;
    } catch (error) {
      this.clearSession();
      throw new Error(this.errorMessage(error, 'La sesión expiró. Inicia sesión nuevamente.'));
    }
  }

  async signOut(reason = 'Cerrar sesion'): Promise<void> {
    const current = this.getStoredSession();
    try {
      if (current?.refreshToken) {
        const response = await firstValueFrom(
          this.http.post<ApiResponse<CierreResponse>>(`${this.loginBase}/cerrar-sesion`, {
            refreshToken: current.refreshToken,
            motivo: reason
          })
        );
        if (!response.success) throw new Error(response.message || 'No fue posible cerrar la sesión.');
      }
    } finally {
      this.clearSession();
    }
  }

  getSession(): AuthSession | null {
    const session = this.getStoredSession();
    if (!session) return null;
    if (session.expiresAt && Date.now() >= new Date(session.expiresAt).getTime()) return null;
    return session;
  }

  clearSession(): void {
    if (typeof window !== 'undefined') window.localStorage.removeItem(this.storageKey);
    this.activeChallenge = null;
  }

  private getStoredSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as AuthSession : null;
    } catch {
      return null;
    }
  }

  private writeSession(session: AuthSession): void {
    if (typeof window !== 'undefined') window.localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private toSession(data: SesionResponse, fallbackUserId: string): AuthSession {
    if (!data.accessToken || !data.refreshToken) throw new Error('La respuesta de sesión está incompleta.');
    const claims = this.decodeJwt(data.accessToken);
    return {
      userId: String(claims?.['idUsuario'] ?? claims?.['sub'] ?? fallbackUserId),
      displayName: String(claims?.['nombreCompleto'] ?? claims?.['nombre'] ?? fallbackUserId ?? 'Usuario Kardex'),
      role: String(claims?.['rol'] ?? 'Usuario'),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType ?? 'Bearer',
      expiresIn: data.expiresIn,
      expiresAt: data.expiresAtUtc,
      sessionExpiresAt: data.sessionExpiresAtUtc ?? null,
      sid: data.sid ?? null
    };
  }

  private unwrap<T>(response: ApiResponse<T>, fallback: string): T {
    if (!response?.success || response.data == null) {
      throw new Error(response?.message || response?.errors?.filter(Boolean).join(' ') || fallback);
    }
    return response.data;
  }

  private toApiChannel(channel: VerificationChannel): string {
    if (channel === 'email') return 'CORREO';
    if (channel === 'telegram') return 'TELEGRAM';
    return 'SMS';
  }

  private fromApiChannel(channel?: string | null): VerificationChannel | null {
    const value = (channel ?? '').trim().toUpperCase();
    if (['CORREO', 'EMAIL', 'MAIL'].includes(value)) return 'email';
    if (value === 'TELEGRAM') return 'telegram';
    if (['SMS', 'MENSAJE SMS'].includes(value)) return 'sms';
    return null;
  }

  private maskDestination(credentials: AccessCredentials, channel: VerificationChannel): string {
    if (channel === 'email') {
      const [local = '', domain = ''] = credentials.email.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    }
    return `******${credentials.phone.slice(-4)}`;
  }

  private jwtExpiration(token: string): string | null {
    const claims = this.decodeJwt(token);
    const exp = Number(claims?.['exp']);
    return Number.isFinite(exp) && exp > 0 ? new Date(exp * 1000).toISOString() : null;
  }

  private decodeJwt(token: string): Record<string, unknown> | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
      return JSON.parse(decodeURIComponent(Array.from(atob(normalized), c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
    } catch {
      return null;
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiResponse<unknown> | string | null;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object') {
        return body.message || body.errors?.filter(Boolean).join(' ') || fallback;
      }
      if (error.status === 0) return 'No fue posible conectar con el servicio de autenticación.';
      if (error.status === 401) return 'Credenciales o código de verificación no válidos.';
      return error.message || fallback;
    }
    return error instanceof Error && error.message ? error.message : fallback;
  }
}

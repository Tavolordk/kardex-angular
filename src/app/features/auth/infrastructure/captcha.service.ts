import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

interface CaptchaResponse {
  id?: string | null;
  imageBase64?: string | null;
}

interface ValidaCaptchaResponse {
  ok: boolean;
  token?: string | null;
}

export interface CaptchaChallenge {
  id: string;
  imageSrc: string;
}

export interface CaptchaValidation {
  ok: boolean;
  token: string | null;
}

@Injectable({ providedIn: 'root' })
export class CaptchaService {
  private readonly baseUrl = '/api/login/Captcha';

  constructor(private readonly http: HttpClient) {}

  async generar(): Promise<CaptchaChallenge> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<CaptchaResponse>>(`${this.baseUrl}/genera-captcha`)
      );
      const data = this.unwrap(response, 'No fue posible generar el captcha.');
      const id = data.id?.trim();
      const imageBase64 = data.imageBase64?.trim();
      if (!id || !imageBase64) {
        throw new Error('El servidor devolvió un captcha incompleto.');
      }
      return { id, imageSrc: this.asImageSource(imageBase64) };
    } catch (error) {
      throw new Error(this.errorMessage(error, 'No fue posible generar el captcha.'));
    }
  }

  async validar(id: string, answer: string): Promise<CaptchaValidation> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<ValidaCaptchaResponse>>(`${this.baseUrl}/validar-captcha`, {
          id,
          answer: answer.trim()
        })
      );
      const data = this.unwrap(response, 'No fue posible validar el captcha.');
      return { ok: data.ok, token: data.token ?? null };
    } catch (error) {
      throw new Error(this.errorMessage(error, 'No fue posible validar el captcha.'));
    }
  }

  private unwrap<T>(response: ApiResponse<T>, fallback: string): T {
    if (!response?.success || !response.data) {
      const details = response?.errors?.filter(Boolean).join(' · ');
      throw new Error(details || response?.message || fallback);
    }
    return response.data;
  }

  private asImageSource(value: string): string {
    if (value.startsWith('data:image/')) return value;
    return `data:image/png;base64,${value}`;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiResponse<unknown> | string | null;
      if (typeof body === 'string' && body.trim()) return body.trim();
      if (body && typeof body === 'object') {
        const details = body.errors?.filter(Boolean).join(' · ');
        return details || body.message || fallback;
      }
      return error.message || fallback;
    }
    return error instanceof Error && error.message ? error.message : fallback;
  }
}

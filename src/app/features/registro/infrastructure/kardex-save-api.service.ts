import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GetCurrentSessionUseCase } from '../../auth/application/get-current-session.use-case';
import { CedulaPayload } from './cedula-borrador.mapper';

interface ApiResponse<T> { success: boolean; message?: string | null; data?: T | null; errors?: string[] | null; }
interface BorradorResponse { idBorrador: number | null; seccion?: string | null; fechaGuardadoUtc?: string | null; expiraEnUtc?: string | null; }
interface BorradorRecuperado extends BorradorResponse { cedula?: CedulaPayload | null; }

@Injectable({ providedIn: 'root' })
export class KardexSaveApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(GetCurrentSessionUseCase);
  private readonly url = '/api/save/Save/cedula-temporal';
  private lastCedula: CedulaPayload | null = null;
  private knownRemoteState = false;

  get cedulaAnterior(): CedulaPayload | null { return this.lastCedula; }

  private key(): string {
    const userId = this.session.execute()?.userId;
    if (!userId) throw new Error('La sesión terminó. Inicia sesión nuevamente para guardar el borrador.');
    return `kardex.save.idBorrador.v1:${userId}`;
  }
  get idBorrador(): number | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.key());
    const id = Number(raw);
    return raw && Number.isInteger(id) && id > 0 ? id : null;
  }
  private headers(): HttpHeaders {
    const token = this.session.execute()?.accessToken;
    if (!token) throw new Error('No hay un token de sesión válido. Inicia sesión nuevamente.');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
  private unwrap<T>(result: ApiResponse<T>, fallback: string): T {
    if (!result?.success || !result.data) throw new Error(result?.message || result?.errors?.join(' · ') || fallback);
    return result.data;
  }
  async save(seccion: string, cedula: CedulaPayload): Promise<BorradorResponse> {
    if (this.idBorrador && !this.knownRemoteState) {
      throw new Error('No se ha podido recuperar la versión vigente del borrador. Vuelve al menú y reintenta la carga antes de guardar, para evitar sobrescribir información.');
    }
    try {
      const result = await firstValueFrom(this.http.post<ApiResponse<BorradorResponse>>(this.url, {
        idBorrador: this.idBorrador, seccion, cedula
      }, { headers: this.headers() }));
      const data = this.unwrap(result, 'El servicio no confirmó el guardado del borrador.');
      const id = Number(data.idBorrador ?? this.idBorrador);
      if (!Number.isInteger(id) || id <= 0) throw new Error('El servicio no devolvió un idBorrador válido.');
      localStorage.setItem(this.key(), String(id));
      this.lastCedula = cedula;
      this.knownRemoteState = true;
      return data;
    } catch (error) { throw this.message(error, 'No fue posible guardar el borrador en el servidor.'); }
  }
  async get(): Promise<BorradorRecuperado | null> {
    const id = this.idBorrador;
    if (!id) { this.knownRemoteState = true; return null; }
    try {
      const result = await firstValueFrom(this.http.get<ApiResponse<BorradorRecuperado>>(`${this.url}/${id}`, { headers: this.headers() }));
      const data = this.unwrap(result, 'No se pudo recuperar el borrador.');
      if (!data.cedula || typeof data.cedula !== 'object') throw new Error('El borrador recuperado no contiene una cédula válida.');
      this.lastCedula = data.cedula;
      this.knownRemoteState = true;
      return data;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        localStorage.removeItem(this.key());
        this.lastCedula = null;
        this.knownRemoteState = true;
        return null;
      }
      this.knownRemoteState = false;
      throw this.message(error, 'No fue posible recuperar el borrador del servidor.');
    }
  }
  async delete(): Promise<void> {
    const id = this.idBorrador;
    if (!id) return;
    try {
      const result = await firstValueFrom(this.http.delete<ApiResponse<BorradorResponse>>(`${this.url}/${id}`, { headers: this.headers() }));
      if (!result?.success) throw new Error(result.message || result.errors?.join(' · ') || 'El servidor no confirmó la eliminación.');
      localStorage.removeItem(this.key());
      this.lastCedula = null;
      this.knownRemoteState = true;
    } catch (error) { throw this.message(error, 'No se pudo eliminar el borrador del servidor.'); }
  }
  private message(error: unknown, fallback: string): Error {
    if (error instanceof HttpErrorResponse) {
      const data = error.error as Partial<ApiResponse<unknown>> | string | null;
      if (error.status === 401) return new Error('Tu sesión no está autorizada para guardar o recuperar borradores. Inicia sesión de nuevo.');
      if (error.status === 0) return new Error('No hay conexión con KardexSaveApi. El avance permanece guardado localmente.');
      if (typeof data === 'string' && data.length < 250) return new Error(data);
      if (data && typeof data === 'object') return new Error(data.message || data.errors?.join(' · ') || fallback);
      return new Error(fallback);
    }
    return error instanceof Error ? error : new Error(fallback);
  }
}

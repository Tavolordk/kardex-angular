import { Injectable, inject } from '@angular/core';
import { GetCurrentSessionUseCase } from '../../features/auth/application/get-current-session.use-case';

/** Estado de navegación del cliente; no sustituye una validación institucional. */
@Injectable({ providedIn: 'root' })
export class KardexFlowService {
  private readonly sessionUseCase = inject(GetCurrentSessionUseCase);

  private get key(): string {
    const session = this.sessionUseCase.execute();
    return `kardex.flow.v1.${encodeURIComponent(session?.userId ?? 'anonymous')}.${encodeURIComponent(session?.sid ?? 'current')}`;
  }

  private read(): { validatedCurp?: string; selectedCurp?: string } {
    if (typeof sessionStorage === 'undefined') return {};
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.key) || '{}') as { validatedCurp?: string; selectedCurp?: string };
      return saved && typeof saved === 'object' ? saved : {};
    } catch { return {}; }
  }

  private write(state: { validatedCurp?: string; selectedCurp?: string }): void {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.key, JSON.stringify(state));
  }

  isValidated(): boolean { return !!this.read().validatedCurp; }
  selectedCurp(): string | null { return this.read().selectedCurp || null; }
  hasSelectedProfile(): boolean { return !!this.read().selectedCurp; }
  isProfileValidated(curp: string): boolean { return this.read().validatedCurp === curp.trim().toUpperCase(); }

  confirmInitialReview(curp: string): void {
    this.write({ validatedCurp: curp.trim().toUpperCase() });
  }

  selectProfile(curp: string): boolean {
    const normalized = curp.trim().toUpperCase();
    if (!this.isProfileValidated(normalized)) return false;
    this.write({ validatedCurp: normalized, selectedCurp: normalized });
    return true;
  }

  invalidateReview(): void { this.write({}); }
  clear(): void {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.key);
  }
}

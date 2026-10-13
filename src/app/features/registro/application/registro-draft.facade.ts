import { Injectable, computed, signal } from '@angular/core';
import { RegistroDraft, RegistroStepKey } from '../domain/models/registro.model';
import { RegistroRepository } from '../domain/repositories/registro.repository';
import { DraftRestoreError } from '../infrastructure/http-registro.repository';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Injectable()
export class RegistroDraftFacade {
  private readonly activeStepState = signal<RegistroStepKey>('identificacion');
  private readonly saveStateSignal = signal<SaveState>('idle');
  private readonly errorSignal = signal<string>('');

  readonly activeStep = this.activeStepState.asReadonly();
  readonly saveState = this.saveStateSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly restoreWarning = signal('');
  readonly isSaving = computed(() => this.saveStateSignal() === 'saving');

  constructor(private readonly repository: RegistroRepository) {}

  setStep(step: RegistroStepKey): void {
    this.activeStepState.set(step);
    this.resetFeedback();
  }

  async loadDraft(): Promise<RegistroDraft | null> {
    try { return await this.repository.loadDraft(); }
    catch (e) {
      this.restoreWarning.set(e instanceof Error ? e.message : 'No se pudo recuperar el borrador remoto.');
      return e instanceof DraftRestoreError ? e.localDraft : null;
    }
  }

  async saveDraft(draft: RegistroDraft, section = 'datosPersonales'): Promise<void> {
    this.saveStateSignal.set('saving');
    this.errorSignal.set('');
    try {
      await this.repository.saveDraft(draft, section);
      this.saveStateSignal.set('saved');
      window.setTimeout(() => this.resetFeedback(), 2200);
    } catch (error) {
      this.saveStateSignal.set('error');
      this.errorSignal.set(error instanceof Error ? error.message : 'No fue posible guardar el borrador.');
    }
  }

  resetFeedback(): void {
    this.saveStateSignal.set('idle');
    this.errorSignal.set('');
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { RegistroDraft, RegistroStepKey } from '../domain/models/registro.model';
import { RegistroRepository } from '../domain/repositories/registro.repository';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Injectable()
export class RegistroDraftFacade {
  private readonly activeStepState = signal<RegistroStepKey>('identificacion');
  private readonly saveStateSignal = signal<SaveState>('idle');
  private readonly errorSignal = signal<string>('');

  readonly activeStep = this.activeStepState.asReadonly();
  readonly saveState = this.saveStateSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isSaving = computed(() => this.saveStateSignal() === 'saving');

  constructor(private readonly repository: RegistroRepository) {}

  setStep(step: RegistroStepKey): void {
    this.activeStepState.set(step);
    this.resetFeedback();
  }

  async loadDraft(): Promise<RegistroDraft | null> {
    return this.repository.loadDraft();
  }

  async saveDraft(draft: RegistroDraft): Promise<void> {
    this.saveStateSignal.set('saving');
    this.errorSignal.set('');
    try {
      await this.repository.saveDraft(draft);
      this.saveStateSignal.set('saved');
      window.setTimeout(() => this.resetFeedback(), 2200);
    } catch {
      this.saveStateSignal.set('error');
      this.errorSignal.set('No fue posible guardar el borrador.');
    }
  }

  resetFeedback(): void {
    this.saveStateSignal.set('idle');
    this.errorSignal.set('');
  }
}

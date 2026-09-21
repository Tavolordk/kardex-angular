import { Injectable } from '@angular/core';
import { EMPTY_REGISTRO_DRAFT, RegistroDraft } from '../domain/models/registro.model';
import { RegistroRepository } from '../domain/repositories/registro.repository';

@Injectable()
export class LocalStorageRegistroRepository extends RegistroRepository {
  private readonly key = 'kardex.registro.draft.v2';

  async loadDraft(): Promise<RegistroDraft | null> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;

    try {
      const stored = JSON.parse(raw) as Partial<RegistroDraft>;
      return { ...EMPTY_REGISTRO_DRAFT, ...stored };
    } catch {
      return null;
    }
  }

  async saveDraft(draft: RegistroDraft): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 250));
    localStorage.setItem(this.key, JSON.stringify(draft));
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

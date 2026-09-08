import { Injectable } from '@angular/core';
import { RegistroDraft } from '../domain/models/registro.model';
import { RegistroRepository } from '../domain/repositories/registro.repository';

@Injectable()
export class LocalStorageRegistroRepository extends RegistroRepository {
  private readonly key = 'kardex.registro.draft.v1';

  async loadDraft(): Promise<RegistroDraft | null> {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) as RegistroDraft : null;
  }

  async saveDraft(draft: RegistroDraft): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 250));
    localStorage.setItem(this.key, JSON.stringify(draft));
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

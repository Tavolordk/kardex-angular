import { Injectable, inject } from '@angular/core';
import { RegistroDraft, EMPTY_REGISTRO_DRAFT } from '../domain/models/registro.model';
import { RegistroRepository } from '../domain/repositories/registro.repository';
import { LocalStorageRegistroRepository } from './local-storage-registro.repository';
import { KardexSaveApiService } from './kardex-save-api.service';
import { buildCedula, restoreOtherSections, restorePerson } from './cedula-borrador.mapper';

@Injectable({ providedIn: 'root' })
export class HttpRegistroRepository extends RegistroRepository {
  private readonly local = inject(LocalStorageRegistroRepository);
  private readonly api = inject(KardexSaveApiService);

  async loadDraft(): Promise<RegistroDraft | null> {
    const local = await this.local.loadDraft();
    try {
      const remote = await this.api.get();
      if (!remote?.cedula) return local;
      restoreOtherSections(remote.cedula);
      const merged = { ...EMPTY_REGISTRO_DRAFT, ...local, ...restorePerson(remote.cedula) };
      await this.local.saveDraft(merged);
      return merged;
    } catch (error) {
      // No se descarta el avance existente por un problema de red, pero se avisa a la pantalla.
      throw new DraftRestoreError(error instanceof Error ? error.message : 'No se pudo recuperar el borrador.', local);
    }
  }

  async saveDraft(draft: RegistroDraft, section = 'datosPersonales'): Promise<void> {
    try { await this.local.saveDraft(draft); } catch { /* No impedir el POST por cuota local. */ }
    await this.api.save(section, buildCedula(draft, this.api.cedulaAnterior, section));
  }

  async clearDraft(): Promise<void> {
    await this.api.delete(); // Si falla el DELETE se conserva el respaldo local.
    await this.local.clearDraft();
  }
}

export class DraftRestoreError extends Error {
  constructor(message: string, readonly localDraft: RegistroDraft | null) { super(message); }
}

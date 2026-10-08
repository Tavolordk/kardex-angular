import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** Certificado sincronizado desde ECCC: nunca se modifica en el formulario. */
export interface CertificacionIndividualRecord {
  hasCertificate: boolean | null;
  issueDate?: string | null;
  institution?: string;
}
export interface EstandarCompetenciaRecord {
  id: number;
  standard: string;
  accreditationDate: string;
}

@Component({
  selector: 'app-certificacion-historial',
  standalone: true,
  templateUrl: './certificacion-historial.component.html',
  styleUrl: './certificacion-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificacionHistorialComponent {
  readonly certificate = input<CertificacionIndividualRecord | null>(null);
  readonly standards = signal<EstandarCompetenciaRecord[]>(this.restoreStandards());
  readonly editingId = signal<number | null>(null);
  private restoreStandards(): EstandarCompetenciaRecord[] {
    try { return JSON.parse(localStorage.getItem('kardex.demo.estandares.v2') || '[]'); } catch { return []; }
  }
  private persist(): void {
    try { localStorage.setItem('kardex.demo.estandares.v2', JSON.stringify(this.standards())); } catch { /* Storage optional */ }
  }
  editStandard(record: EstandarCompetenciaRecord): void {
    this.editingId.set(record.id);
    this.standardName.set(record.standard);
    this.accreditationDate.set(record.accreditationDate);
    this.formError.set('');
    this.isModalOpen.set(true);
  }
  deleteStandard(record: EstandarCompetenciaRecord): void {
    if (!confirm(`¿Eliminar el estándar "${record.standard}"?`)) return;
    this.standards.update(items => items.filter(x => x.id !== record.id));
    this.persist();
    this.selectedRecord.set(null);
  }
  readonly isModalOpen = signal(false);
  readonly standardName = signal('');
  readonly accreditationDate = signal('');
  readonly formError = signal('');
  readonly selectedRecord = signal<EstandarCompetenciaRecord | null>(null);

  openAdd(): void {
    this.editingId.set(null);
    this.standardName.set('');
    this.accreditationDate.set('');
    this.formError.set('');
    this.isModalOpen.set(true);
  }
  closeAdd(): void { this.isModalOpen.set(false); }
  saveStandard(): void {
    const standard = this.standardName().trim();
    const date = this.accreditationDate();
    if (!standard || !date) {
      this.formError.set('El estándar y su fecha de acreditación son obligatorios.');
      return;
    }
    if (date > new Date().toISOString().slice(0, 10)) {
      this.formError.set('La fecha de acreditación no puede ser futura.');
      return;
    }
    const id = this.editingId();
    this.standards.update(items => id === null
      ? [...items, { id: Date.now(), standard, accreditationDate: date }]
      : items.map(item => item.id === id ? { ...item, standard, accreditationDate: date } : item));
    this.persist();
    this.closeAdd();
  }
  viewDetails(record: EstandarCompetenciaRecord): void { this.selectedRecord.set(record); }
  closeDetails(): void { this.selectedRecord.set(null); }
}

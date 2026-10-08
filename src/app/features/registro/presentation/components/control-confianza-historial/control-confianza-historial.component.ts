import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** Información de ECCC. El componente es deliberadamente de solo lectura. */
export interface ControlConfianzaRecord {
  status: 'Vigente' | 'Vencido' | 'En proceso';
  result: 'Aprobado' | 'No aprobado' | 'En evaluación';
  evaluationDate: string;
  expirationDate: string;
  institution: string;
}

@Component({
  selector: 'app-control-confianza-historial',
  standalone: true,
  templateUrl: './control-confianza-historial.component.html',
  styleUrl: './control-confianza-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlConfianzaHistorialComponent {
  // Los registros solo deben llegar desde la integración ECCC; no se crean manualmente.
  readonly records = input<readonly ControlConfianzaRecord[]>([]);
  readonly selectedRecord = signal<ControlConfianzaRecord | null>(null);
  private parseDate(value: string): Date | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    const date = m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  expiry(record: ControlConfianzaRecord): Date | null {
    const date = this.parseDate(record.evaluationDate);
    if (!date) return null;
    const expiry = new Date(date);
    expiry.setFullYear(expiry.getFullYear() + 3);
    return expiry;
  }
  expiryLabel(record: ControlConfianzaRecord): string {
    const date = this.expiry(record);
    return date ? new Intl.DateTimeFormat('es-MX', {day:'2-digit',month:'2-digit',year:'numeric'}).format(date) : 'No disponible';
  }
  statusLabel(record: ControlConfianzaRecord): string {
    const expiry = this.expiry(record);
    if (!expiry) return 'Sin información';
    return expiry.getTime() < new Date().setHours(0,0,0,0) ? 'Vencido' : 'Vigente';
  }

  viewDetails(record: ControlConfianzaRecord): void { this.selectedRecord.set(record); }
  closeDetails(): void { this.selectedRecord.set(null); }
}

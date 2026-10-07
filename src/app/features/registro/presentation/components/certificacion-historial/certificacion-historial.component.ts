import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';

interface CertificationRecord {
  status: 'Vigente' | 'Vencida';
  startDate: string;
  endDate: string;
  institution: string;
  standard: string;
}

@Component({
  selector: 'app-certificacion-historial',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './certificacion-historial.component.html',
  styleUrl: './certificacion-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificacionHistorialComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly modalOpen = signal(false);
  readonly selectedRecord = signal<CertificationRecord | null>(null);

  readonly records = signal<CertificationRecord[]>([
    {
      status: 'Vigente',
      startDate: '15/03/2024',
      endDate: '15/03/2027',
      institution: 'Academia Nacional de Seguridad Pública',
      standard: 'Competencias de la función policial'
    },
    {
      status: 'Vencida',
      startDate: '08/02/2020',
      endDate: '08/02/2023',
      institution: 'Instituto de Formación Policial',
      standard: 'Competencia policial básica'
    }
  ]);

  readonly certificationForm = this.fb.group({
    certificacionIndividual: ['si' as 'si' | 'no', Validators.required],
    fechaEmisionCertificacion: ['', Validators.required],
    fechaVencimientoCertificacion: ['', Validators.required],
    institucionAcreditadora: ['', Validators.required],
    estandarCompetencia: ['', Validators.required],
    fechaAcreditacionEstandar: ['', Validators.required]
  });

  openModal(): void {
    this.selectedRecord.set(null);
    this.certificationForm.reset({ certificacionIndividual: 'si' });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  setCertificationIndividual(value: 'si' | 'no'): void {
    this.certificationForm.controls.certificacionIndividual.setValue(value);
  }

  addCertification(): void {
    if (this.certificationForm.invalid) {
      this.certificationForm.markAllAsTouched();
      return;
    }

    const value = this.certificationForm.getRawValue();
    const start = this.toDisplayDate(value.fechaEmisionCertificacion);
    const end = this.toDisplayDate(value.fechaVencimientoCertificacion);
    const status: CertificationRecord['status'] = this.isExpired(value.fechaVencimientoCertificacion) ? 'Vencida' : 'Vigente';

    this.records.update(items => [{
      status,
      startDate: start,
      endDate: end,
      institution: value.institucionAcreditadora,
      standard: value.estandarCompetencia
    }, ...items]);
    this.closeModal();
  }

  viewDetails(record: CertificationRecord): void {
    this.selectedRecord.set(record);
  }

  closeDetails(): void {
    this.selectedRecord.set(null);
  }

  private toDisplayDate(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  private isExpired(value: string): boolean {
    if (!value) return false;
    const date = new Date(`${value}T23:59:59`);
    return Number.isFinite(date.getTime()) && date.getTime() < Date.now();
  }
}

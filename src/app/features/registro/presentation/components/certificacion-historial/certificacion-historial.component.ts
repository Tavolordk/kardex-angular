import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { inject } from '@angular/core';

interface CertificationRecord {
  status: 'Vigente' | 'Vencida';
  type: string;
  startDate: string;
  endDate: string;
  institution: string;
  result: string;
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
      type: 'ECCC · Aprobado',
      startDate: '15/03/2023',
      endDate: '15/03/2026',
      institution: 'Centro Estatal de Evaluación y Control de Confianza',
      result: 'Aprobado'
    },
    {
      status: 'Vencida',
      type: 'Certificación individual',
      startDate: '08/02/2020',
      endDate: '08/02/2023',
      institution: 'Academia Nacional de Seguridad Pública',
      result: 'Aprobado'
    },
    {
      status: 'Vencida',
      type: 'Competencia policial básica',
      startDate: '21/06/2017',
      endDate: '21/06/2020',
      institution: 'Instituto de Formación Policial',
      result: 'Aprobado'
    }
  ]);

  readonly certificationForm = this.fb.group({
    resultadoEccc: ['', Validators.required],
    fechaUltimaEccc: ['', Validators.required],
    certificacionIndividual: ['no' as 'si' | 'no', Validators.required],
    fechaEmisionCertificacion: ['', Validators.required],
    fechaVencimientoControl: ['', Validators.required],
    institucionAcreditadora: ['', Validators.required],
    estandarCompetencia: ['', Validators.required],
    fechaAcreditacionEstandar: ['', Validators.required]
  });

  openModal(): void {
    this.selectedRecord.set(null);
    this.certificationForm.reset({ certificacionIndividual: 'no' });
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
    const start = this.toDisplayDate(value.fechaEmisionCertificacion || value.fechaUltimaEccc);
    const end = this.toDisplayDate(value.fechaVencimientoControl);
    const status: CertificationRecord['status'] = this.isExpired(value.fechaVencimientoControl) ? 'Vencida' : 'Vigente';

    this.records.update(items => [
      {
        status,
        type: value.certificacionIndividual === 'si' ? 'Certificación individual' : `ECCC · ${value.resultadoEccc || 'Registrado'}`,
        startDate: start,
        endDate: end,
        institution: value.institucionAcreditadora,
        result: value.resultadoEccc
      },
      ...items
    ]);
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

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';

interface ControlConfianzaRecord {
  status: 'Vigente' | 'Vencido';
  result: 'Aprobado' | 'No aprobado' | 'En evaluación';
  evaluationDate: string;
  expirationDate: string;
  institution: string;
}

@Component({
  selector: 'app-control-confianza-historial',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './control-confianza-historial.component.html',
  styleUrl: './control-confianza-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlConfianzaHistorialComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly modalOpen = signal(false);
  readonly selectedRecord = signal<ControlConfianzaRecord | null>(null);

  readonly records = signal<ControlConfianzaRecord[]>([
    {
      status: 'Vigente',
      result: 'Aprobado',
      evaluationDate: '15/03/2023',
      expirationDate: '15/03/2026',
      institution: 'Centro Estatal de Evaluación y Control de Confianza'
    },
    {
      status: 'Vencido',
      result: 'Aprobado',
      evaluationDate: '08/02/2020',
      expirationDate: '08/02/2023',
      institution: 'Centro Estatal de Evaluación y Control de Confianza'
    }
  ]);

  readonly form = this.fb.group({
    resultadoEccc: ['', Validators.required],
    fechaUltimaEccc: ['', Validators.required],
    fechaVencimientoControl: ['', Validators.required],
    institucionEvaluadora: ['', Validators.required]
  });

  openModal(): void {
    this.selectedRecord.set(null);
    this.form.reset();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  addRecord(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.records.update(items => [{
      status: this.isExpired(value.fechaVencimientoControl) ? 'Vencido' : 'Vigente',
      result: value.resultadoEccc as ControlConfianzaRecord['result'],
      evaluationDate: this.toDisplayDate(value.fechaUltimaEccc),
      expirationDate: this.toDisplayDate(value.fechaVencimientoControl),
      institution: value.institucionEvaluadora
    }, ...items]);
    this.closeModal();
  }

  viewDetails(record: ControlConfianzaRecord): void {
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

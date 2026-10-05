import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoOption } from '../../../../catalogos/domain/models/catalogo.model';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';

interface RecruitmentProcess {
  folio: string;
  convocatoria: string;
  estrategia: string;
  fecha: string;
  estatus: string;
}

@Component({
  selector: 'app-reclutamiento-historial',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reclutamiento-historial.component.html',
  styleUrl: './reclutamiento-historial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclutamientoHistorialComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly catalogos = inject(CatalogosService);

  readonly modalOpen = signal(false);
  readonly strategies = signal<CatalogoOption[]>([]);
  readonly statuses = signal<CatalogoOption[]>([]);
  readonly results = signal<CatalogoOption[]>([]);
  readonly noEntryCauses = signal<CatalogoOption[]>([]);

  readonly processes = signal<RecruitmentProcess[]>([
    { folio: 'RSP-2026-00418', convocatoria: 'Policía de Proximidad 2026', estrategia: 'Feria de empleo', fecha: '08/09/2026', estatus: 'En evaluación' },
    { folio: 'RSP-2025-01307', convocatoria: 'Convocatoria Estatal 2025', estrategia: 'Portal institucional', fecha: '14/11/2025', estatus: 'Aprobado' },
    { folio: 'RSP-2024-00892', convocatoria: 'Policía Preventiva 2024', estrategia: 'Recomendación', fecha: '03/06/2024', estatus: 'Aprobado' }
  ]);

  readonly processForm = this.fb.group({
    folio: ['', Validators.required],
    convocatoria: ['', Validators.required],
    perfilIngreso: ['', Validators.required],
    estrategia: ['', Validators.required],
    estrategiaDetalle: ['', Validators.required],
    fechaRegistro: ['', Validators.required],
    estatus: ['', Validators.required],
    tiempoProceso: [''],
    resultado: ['', Validators.required],
    causaNoIngreso: ['', Validators.required],
    fechaResolucion: ['', Validators.required]
  });

  async ngOnInit(): Promise<void> {
    const [strategies, statuses, results, causes] = await Promise.allSettled([
      this.catalogos.estrategiaReclutamiento(),
      this.catalogos.estatusReclutamiento(),
      this.catalogos.resultadoSeleccion(),
      this.catalogos.causaNoIngreso()
    ]);
    if (strategies.status === 'fulfilled') this.strategies.set(strategies.value);
    if (statuses.status === 'fulfilled') this.statuses.set(statuses.value);
    if (results.status === 'fulfilled') this.results.set(results.value);
    if (causes.status === 'fulfilled') this.noEntryCauses.set(causes.value);
  }

  openModal(): void {
    this.processForm.reset();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  addProcess(): void {
    if (this.processForm.invalid) {
      this.processForm.markAllAsTouched();
      return;
    }
    const value = this.processForm.getRawValue();
    this.processes.update((items: RecruitmentProcess[]) => [{
      folio: value.folio,
      convocatoria: value.convocatoria,
      estrategia: value.estrategiaDetalle || value.estrategia,
      fecha: this.toDisplayDate(value.fechaRegistro),
      estatus: value.estatus
    }, ...items]);
    this.closeModal();
  }

  editProcess(index: number): void {
    const process = this.processes()[index];
    if (!process) return;
    const [day, month, year] = process.fecha.split('/');
    this.processForm.reset({
      folio: process.folio,
      convocatoria: process.convocatoria,
      perfilIngreso: '',
      estrategia: process.estrategia,
      estrategiaDetalle: process.estrategia,
      fechaRegistro: year && month && day ? `${year}-${month}-${day}` : '',
      estatus: process.estatus,
      tiempoProceso: '',
      resultado: '',
      causaNoIngreso: '',
      fechaResolucion: ''
    });
    this.modalOpen.set(true);
  }

  deleteProcess(index: number): void {
    this.processes.update((items: RecruitmentProcess[]) => items.filter((_, current) => current !== index));
  }

  private toDisplayDate(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}

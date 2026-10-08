import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { CatalogoOption } from '../../../../catalogos/domain/models/catalogo.model';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';

interface RecruitmentProcess {
  folio: string;
  convocatoria: string;
  estrategia: string;
  fecha: string;
  estatus: string;
  perfilIngreso: string;
  estrategiaCodigo: string;
  estrategiaDetalle: string;
  fechaResolucion: string;
  resultado: string;
  causaNoIngreso: string;
}

@Component({
  selector: 'app-reclutamiento-historial',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
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

  readonly processes = signal<RecruitmentProcess[]>(this.restoreProcesses());
  private readonly storageKey = 'kardex.demo.reclutamiento.v2';
  private restoreProcesses(): RecruitmentProcess[] {
    try { return JSON.parse(localStorage.getItem('kardex.demo.reclutamiento.v2') || '[]') as RecruitmentProcess[]; }
    catch { return []; }
  }
  private persistProcesses(): void {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.processes())); } catch { /* Demo storage can be unavailable. */ }
  }
  readonly editingIndex = signal<number | null>(null);

  readonly processForm = this.fb.group({
    folio: ['', Validators.required],
    convocatoria: ['', Validators.required],
    perfilIngreso: [{value: '', disabled: true}, Validators.required],
    estrategia: ['', Validators.required],
    estrategiaDetalle: [''],
    fechaRegistro: ['', Validators.required],
    estatus: ['', Validators.required],
    tiempoProceso: [''],
    resultado: [{value: '', disabled: true}],
    causaNoIngreso: [{value: '', disabled: true}],
    fechaResolucion: ['']
  });

  readonly finalStatuses = ['APROBADO', 'NO APROBADO', 'DESISTIÓ', 'CANCELADO'];
  isFinalStatus(): boolean { return this.finalStatuses.includes(this.processForm.controls.estatus.value.trim().toUpperCase()); }
  isOtherStrategy(): boolean { return this.processForm.controls.estrategia.value.trim().toUpperCase() === 'OTRO' || this.strategies().some(x => x.value === this.processForm.controls.estrategia.value && x.label.trim().toUpperCase() === 'OTRO'); }
  requiresCause(): boolean { const v = this.processForm.controls.resultado.value; const text = this.results().find(x => String(x.value) === v)?.label ?? v; return this.isFinalStatus() && !!v && text.trim().toUpperCase() !== 'SELECCIONADO'; }
  elapsedTime(): string {
    const {fechaRegistro, fechaResolucion} = this.processForm.getRawValue();
    if (!fechaResolucion || !fechaRegistro) return 'En proceso';
    const days = Math.round((new Date(fechaResolucion + 'T12:00:00').getTime() - new Date(fechaRegistro + 'T12:00:00').getTime()) / 86400000);
    return days >= 0 ? `${days} días` : 'Fecha de resolución inválida';
  }
  private syncFields(): void {
    const f = this.processForm.controls;
    if (f.convocatoria.value.trim()) f.perfilIngreso.enable({emitEvent:false});
    else { f.perfilIngreso.setValue('', {emitEvent:false}); f.perfilIngreso.disable({emitEvent:false}); }
    if (this.isFinalStatus()) f.resultado.enable({emitEvent:false});
    else { f.resultado.setValue('', {emitEvent:false}); f.resultado.disable({emitEvent:false}); }
    if (this.requiresCause()) f.causaNoIngreso.enable({emitEvent:false});
    else { f.causaNoIngreso.setValue('', {emitEvent:false}); f.causaNoIngreso.disable({emitEvent:false}); }
    f.estrategiaDetalle.setValidators(this.isOtherStrategy() ? [Validators.required, Validators.maxLength(100)] : []);
    f.estrategiaDetalle.updateValueAndValidity({emitEvent:false});
    f.fechaResolucion.setValidators(this.isFinalStatus() ? [Validators.required] : []);
    f.fechaResolucion.updateValueAndValidity({emitEvent:false});
    f.resultado.setValidators(this.isFinalStatus() ? [Validators.required] : []);
    f.resultado.updateValueAndValidity({emitEvent:false});
    f.causaNoIngreso.setValidators(this.requiresCause() ? [Validators.required] : []);
    f.causaNoIngreso.updateValueAndValidity({emitEvent:false});
  }

  async ngOnInit(): Promise<void> {
    this.processForm.valueChanges.subscribe(() => this.syncFields());
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
    this.editingIndex.set(null);
    this.processForm.reset();
    this.syncFields();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  addProcess(): void {
    this.syncFields();
    const {fechaRegistro, fechaResolucion} = this.processForm.getRawValue();
    if (fechaResolucion && fechaRegistro && fechaResolucion < fechaRegistro) {
      this.processForm.controls.fechaResolucion.setErrors({beforeRegistration: true});
    }
    if (this.processForm.invalid) {
      this.processForm.markAllAsTouched();
      return;
    }
    const value = this.processForm.getRawValue();
    const updated: RecruitmentProcess = {
      folio: value.folio,
      convocatoria: value.convocatoria,
      estrategia: this.isOtherStrategy() ? value.estrategiaDetalle : value.estrategia,
      fecha: this.toDisplayDate(value.fechaRegistro),
      estatus: value.estatus,
      perfilIngreso: value.perfilIngreso,
      estrategiaCodigo: value.estrategia,
      estrategiaDetalle: value.estrategiaDetalle,
      fechaResolucion: value.fechaResolucion,
      resultado: value.resultado,
      causaNoIngreso: value.causaNoIngreso
    };
    const editing = this.editingIndex();
    this.processes.update(items => editing === null ? [updated, ...items] : items.map((item, i) => i === editing ? updated : item));
    this.persistProcesses();
    this.closeModal();
  }

  editProcess(index: number): void {
    const process = this.processes()[index];
    if (!process) return;
    const [day, month, year] = process.fecha.split('/');
    this.editingIndex.set(index);
    this.processForm.reset({
      folio: process.folio,
      convocatoria: process.convocatoria,
      perfilIngreso: process.perfilIngreso,
      estrategia: process.estrategiaCodigo,
      estrategiaDetalle: process.estrategiaDetalle,
      fechaRegistro: year && month && day ? `${year}-${month}-${day}` : '',
      estatus: process.estatus,
      tiempoProceso: '',
      resultado: process.resultado,
      causaNoIngreso: process.causaNoIngreso,
      fechaResolucion: process.fechaResolucion
    });
    this.syncFields();
    this.modalOpen.set(true);
  }

  deleteProcess(index: number): void {
    if (!confirm("¿Eliminar este proceso de reclutamiento? Esta acción no se puede deshacer.")) return;
    this.processes.update((items: RecruitmentProcess[]) => items.filter((_, current) => current !== index));
    this.persistProcesses();
  }

  private toDisplayDate(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { CatalogoOption, entidadRnpspId } from '../../../../catalogos/domain/models/catalogo.model';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';

@Component({
  selector: 'app-origen-residencia-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './origen-residencia-form.component.html',
  styleUrl: '../form-sections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrigenResidenciaFormComponent implements OnInit {
  private readonly catalogos = inject(CatalogosService);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = input.required<FormGroup>();

  readonly entidades = signal<CatalogoOption[]>([]);
  readonly municipios = signal<CatalogoOption[]>([]);
  readonly localidades = signal<CatalogoOption[]>([]);
  readonly colonias = signal<CatalogoOption[]>([]);
  readonly calles = signal<CatalogoOption[]>([]);
  readonly localidadSeleccionada = signal<number | null>(null);
  readonly catalogError = signal('');

  private cartoDisponible = false;
  private municipioRequest = 0;
  private localidadRequest = 0;
  private coloniaRequest = 0;
  private calleRequest = 0;

  ngOnInit(): void {
    // Los cambios programáticos al recuperar un borrador no deben borrar los datos existentes.
    this.form().get('entidadResidencia')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { void this.loadMunicipios(); });
    this.form().get('municipioResidencia')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { void this.loadLocalidades(); });
    this.form().get('colonia')?.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { void this.loadCalles(); });
    void this.loadEntidades();
  }

  onEntidadChange(): void {
    this.form().patchValue({ municipioResidencia: '', colonia: '', calle: '' }, { emitEvent: false });
    this.clearLocalidades();
    void this.loadMunicipios();
  }

  onMunicipioChange(): void {
    this.form().patchValue({ colonia: '', calle: '' }, { emitEvent: false });
    this.clearLocalidades();
    void this.loadLocalidades();
  }

  onLocalidadChange(value: string): void {
    const id = Number(value);
    this.localidadSeleccionada.set(Number.isInteger(id) && id > 0 ? id : null);
    this.form().patchValue({ colonia: '', calle: '' }, { emitEvent: false });
    void this.loadColonias();
  }

  onColoniaChange(): void {
    this.form().get('calle')?.setValue('', { emitEvent: false });
    void this.loadCalles();
  }

  private async loadEntidades(): Promise<void> {
    try {
      try {
        const estados = await this.catalogos.estadosCarto();
        const selected = String(this.form().get('entidadResidencia')?.value || '');
        this.cartoDisponible = estados.length > 0 && estados.every(option => Number.isInteger(Number(option.id))) &&
          (!selected || estados.some(option => option.value === selected));
        if (this.cartoDisponible) this.entidades.set(estados);
      } catch { this.cartoDisponible = false; }
      if (!this.cartoDisponible) this.entidades.set(await this.catalogos.entidadesRnpsp());
      await this.loadMunicipios();
    } catch {
      this.catalogError.set('No se pudo consultar el catálogo de entidades.');
    }
  }

  private estadoId(): number | null {
    return entidadRnpspId(this.entidades(), String(this.form().get('entidadResidencia')?.value || ''));
  }

  private municipioId(): number | null {
    return entidadRnpspId(this.municipios(), String(this.form().get('municipioResidencia')?.value || ''));
  }

  private async loadMunicipios(): Promise<void> {
    const request = ++this.municipioRequest;
    this.municipios.set([]);
    this.clearLocalidades();
    const id = this.estadoId();
    if (id === null) return;
    try {
      const options = this.cartoDisponible
        ? await this.catalogos.municipiosCarto(id)
        : await this.catalogos.municipiosRnpsp(id);
      if (request !== this.municipioRequest) return;
      this.municipios.set(options);
      this.catalogError.set('');
      await this.loadLocalidades();
    } catch {
      if (request !== this.municipioRequest) return;
      if (this.cartoDisponible) {
        try {
          const legacy = await this.catalogos.entidadesRnpsp();
          const selected = String(this.form().get('entidadResidencia')?.value || '');
          const legacyId = entidadRnpspId(legacy, selected);
          if (legacyId !== null) {
            const municipios = await this.catalogos.municipiosRnpsp(legacyId);
            if (request !== this.municipioRequest) return;
            this.cartoDisponible = false;
            this.entidades.set(legacy);
            this.municipios.set(municipios);
            this.catalogError.set('');
            return;
          }
        } catch { /* Sin equivalencia documentada entre IDs de RNPSP y Carto. */ }
      }
      this.catalogError.set('No se pudieron consultar los municipios de residencia.');
    }
  }

  private clearLocalidades(): void {
    ++this.localidadRequest;
    ++this.coloniaRequest;
    ++this.calleRequest;
    this.localidades.set([]);
    this.localidadSeleccionada.set(null);
    this.colonias.set([]);
    this.calles.set([]);
  }

  private async loadLocalidades(): Promise<void> {
    const request = ++this.localidadRequest;
    ++this.coloniaRequest;
    ++this.calleRequest;
    this.localidades.set([]);
    this.localidadSeleccionada.set(null);
    this.colonias.set([]);
    this.calles.set([]);
    if (!this.cartoDisponible) return;
    const estadoId = this.estadoId();
    const municipioId = this.municipioId();
    if (estadoId === null || municipioId === null) return;
    try {
      const opciones = await this.catalogos.localidadesCarto(estadoId, municipioId);
      if (request !== this.localidadRequest) return;
      this.localidades.set(opciones);
      // Sólo se elige automáticamente cuando el backend devuelve una única localidad.
      if (opciones.length === 1 && opciones[0].id !== undefined) {
        this.localidadSeleccionada.set(Number(opciones[0].id));
        await this.loadColonias();
      }
    } catch {
      if (request === this.localidadRequest) this.catalogError.set('No se pudieron cargar las localidades; puede capturar el domicilio manualmente.');
    }
  }

  private async loadColonias(): Promise<void> {
    const request = ++this.coloniaRequest;
    ++this.calleRequest;
    this.colonias.set([]);
    this.calles.set([]);
    if (!this.cartoDisponible) return;
    const estadoId = this.estadoId();
    const municipioId = this.municipioId();
    const localidadId = this.localidadSeleccionada();
    if (estadoId === null || municipioId === null || localidadId === null) return;
    try {
      const opciones = await this.catalogos.coloniasCarto(estadoId, municipioId, localidadId);
      if (request !== this.coloniaRequest) return;
      this.colonias.set(opciones);
      await this.loadCalles();
    } catch {
      if (request === this.coloniaRequest) this.catalogError.set('No se pudieron cargar colonias; puede escribirla manualmente.');
    }
  }

  private async loadCalles(): Promise<void> {
    const request = ++this.calleRequest;
    this.calles.set([]);
    if (!this.cartoDisponible) return;
    const estadoId = this.estadoId();
    const municipioId = this.municipioId();
    const localidadId = this.localidadSeleccionada();
    const colonia = String(this.form().get('colonia')?.value || '');
    const coloniaId = entidadRnpspId(this.colonias(), colonia);
    if (estadoId === null || municipioId === null || localidadId === null || coloniaId === null) return;
    try {
      const opciones = await this.catalogos.callesCarto(estadoId, municipioId, localidadId, coloniaId);
      if (request === this.calleRequest) this.calles.set(opciones);
    } catch {
      if (request === this.calleRequest) this.catalogError.set('No se pudieron cargar calles; puede escribirla manualmente.');
    }
  }
}

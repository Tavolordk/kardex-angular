import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  readonly catalogError = signal('');
  private municipioRequest = 0;
  private cartoDisponible = false;

  ngOnInit(): void {
    this.form().get('entidadResidencia')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form().get('municipioResidencia')?.setValue('');
      void this.loadMunicipios();
    });
    void this.loadEntidades();
  }

  private async loadEntidades(): Promise<void> {
    try {
      try {
        const estados = await this.catalogos.estadosCarto();
        this.cartoDisponible = estados.some(estado => estado.id !== undefined && Number.isInteger(Number(estado.id)));
        if (this.cartoDisponible) {
          const selected = String(this.form().get('entidadResidencia')?.value || '');
          if (selected && !estados.some(estado => estado.value === selected)) this.cartoDisponible = false;
          else this.entidades.set(estados);
        }
      } catch { this.cartoDisponible = false; }
      if (!this.cartoDisponible) this.entidades.set(await this.catalogos.entidadesRnpsp());
      await this.loadMunicipios();
    } catch {
      this.catalogError.set('No se pudo consultar el catálogo de entidades.');
    }
  }

  private async loadMunicipios(): Promise<void> {
    const request = ++this.municipioRequest;
    this.municipios.set([]);
    const id = entidadRnpspId(this.entidades(), String(this.form().get('entidadResidencia')?.value || ''));
    if (id === null) {
      if (this.form().get('entidadResidencia')?.value && this.entidades().length)
        this.catalogError.set('La entidad seleccionada no contiene un identificador válido para consultar municipios.');
      return;
    }
    try {
      const options = this.cartoDisponible ? await this.catalogos.municipiosCarto(id) : await this.catalogos.municipiosRnpsp(id);
      if (request === this.municipioRequest) this.municipios.set(options);
    } catch {
      if (request !== this.municipioRequest) return;
      if (this.cartoDisponible) {
        try {
          const legacy = await this.catalogos.entidadesRnpsp();
          const selected = String(this.form().get('entidadResidencia')?.value || '');
          const legacyId = entidadRnpspId(legacy, selected);
          if (legacyId !== null) {
            this.cartoDisponible = false;
            this.entidades.set(legacy);
            this.municipios.set(await this.catalogos.municipiosRnpsp(legacyId));
            this.catalogError.set('');
            return;
          }
        } catch { /* Mantener visible el error sin inventar identificadores equivalentes. */ }
      }
      this.catalogError.set('No se pudieron consultar los municipios de residencia.');
    }
  }
}

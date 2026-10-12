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

  ngOnInit(): void {
    this.form().get('entidadResidencia')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form().get('municipioResidencia')?.setValue('');
      void this.loadMunicipios();
    });
    void this.loadEntidades();
  }

  private async loadEntidades(): Promise<void> {
    try {
      this.entidades.set(await this.catalogos.entidadesRnpsp());
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
        this.catalogError.set('La entidad seleccionada no contiene un identificador RNPSP válido para consultar municipios.');
      return;
    }
    try {
      const options = await this.catalogos.municipiosRnpsp(id);
      if (request === this.municipioRequest) this.municipios.set(options);
    } catch {
      if (request === this.municipioRequest) this.catalogError.set('No se pudieron consultar los municipios de residencia.');
    }
  }
}

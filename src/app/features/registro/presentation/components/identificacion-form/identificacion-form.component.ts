import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { ASSETS } from '../../../../../core/constants/assets';
import { CatalogoOption } from '../../../../catalogos/domain/models/catalogo.model';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';

@Component({
  selector: 'app-identificacion-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './identificacion-form.component.html',
  styleUrls: ['../form-sections.scss', './identificacion-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentificacionFormComponent {
  private readonly catalogos = inject(CatalogosService);

  readonly form = input.required<FormGroup>();
  readonly licenseError = signal('');
  readonly catalogError = signal('');
  readonly assets = ASSETS;

  readonly sexos = signal<CatalogoOption[]>([]);
  readonly identidadesGenero = signal<CatalogoOption[]>([]);
  readonly paises = signal<CatalogoOption[]>([]);
  readonly estadosCiviles = signal<CatalogoOption[]>([]);
  readonly vulnerabilidades = signal<CatalogoOption[]>([]);

  constructor() {
    void this.loadCatalogos();
  }

  private async loadCatalogos(): Promise<void> {
    this.catalogError.set('');
    const results = await Promise.allSettled([
      this.catalogos.sexo(),
      this.catalogos.identidadGenero(),
      this.catalogos.pais(),
      this.catalogos.estadoCivil(),
      this.catalogos.tipoVulnerabilidad()
    ]);

    if (results[0].status === 'fulfilled') this.sexos.set(results[0].value);
    if (results[1].status === 'fulfilled') this.identidadesGenero.set(results[1].value);
    if (results[2].status === 'fulfilled') this.paises.set(results[2].value);
    if (results[3].status === 'fulfilled') this.estadosCiviles.set(results[3].value);
    if (results[4].status === 'fulfilled') this.vulnerabilidades.set(results[4].value);

    if (results.some(result => result.status === 'rejected')) {
      this.catalogError.set('No fue posible cargar uno o más catálogos. Intenta nuevamente.');
    }
  }

  hasVulnerableGroup(group: string): boolean {
    const selected = this.form().get('gruposVulnerables')?.value as string[] | null;
    return selected?.includes(group) ?? false;
  }

  toggleVulnerableGroup(group: string, checked: boolean): void {
    const control = this.form().get('gruposVulnerables');
    const current = [...((control?.value as string[] | null) ?? [])];
    const next = checked ? [...new Set([...current, group])] : current.filter(item => item !== group);
    control?.setValue(next);
    control?.markAsDirty();
  }

  onLicenseFile(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;

    this.licenseError.set('');
    const accepted = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!accepted.includes(file.type)) {
      this.licenseError.set('El documento debe ser PDF, JPG o PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.licenseError.set('El documento debe pesar máximo 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.form().patchValue({
      documentoLicenciaNombre: file.name,
      documentoLicenciaDataUrl: String(reader.result ?? '')
    });
    reader.readAsDataURL(file);
  }
}

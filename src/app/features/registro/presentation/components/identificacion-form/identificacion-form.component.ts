import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { ASSETS } from '../../../../../core/constants/assets';
import { CatalogoOption, entidadRnpspId } from '../../../../catalogos/domain/models/catalogo.model';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';

@Component({
  selector: 'app-identificacion-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './identificacion-form.component.html',
  styleUrls: ['../form-sections.scss', './identificacion-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentificacionFormComponent implements OnInit {
  private readonly catalogos = inject(CatalogosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<FormGroup>();
  readonly licenseError = signal('');
  readonly catalogError = signal('');
  readonly assets = ASSETS;

  readonly sexos = signal<CatalogoOption[]>([]);
  readonly identidadesGenero = signal<CatalogoOption[]>([]);
  readonly paises = signal<CatalogoOption[]>([]);
  readonly estadosCiviles = signal<CatalogoOption[]>([]);
  readonly vulnerabilidades = signal<CatalogoOption[]>([]);
  readonly nacionalidadesRnpsp = signal<CatalogoOption[]>([]);
  readonly tiposSangre = signal<CatalogoOption[]>([]);
  readonly factoresSangre = signal<CatalogoOption[]>([]);
  readonly entidades = signal<CatalogoOption[]>([]);
  readonly municipiosNacimiento = signal<CatalogoOption[]>([]);
  private municipioRequest = 0;
  isMexico(): boolean {
    const selected = String(this.form().get('nacionalidad')?.value || '');
    const label = this.paises().find(p => String(p.value) === selected)?.label || selected;
    return /M[EÉ]XICO/i.test(label);
  }
  onCountryChange(): void {
    const selected = String(this.form().get('nacionalidad')?.value || '');
    if (!selected) return;
    const mexico = this.isMexico();
    for (const key of ['entidadNacimiento', 'municipioNacimiento']) {
      const control = this.form().get(key);
      if (!control) continue;
      control.setValidators(mexico ? [Validators.required] : []);
      if (!mexico) { control.setValue(''); control.disable(); }
      else control.enable();
      control.updateValueAndValidity();
    }
  }
  ngOnInit(): void {
    this.form().get('entidadNacimiento')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form().get('municipioNacimiento')?.setValue('');
      void this.loadMunicipiosNacimiento();
    });
    this.form().get('nacionalidad')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.onCountryChange());
    void this.loadCatalogos();
  }

  private async loadMunicipiosNacimiento(): Promise<void> {
    const request = ++this.municipioRequest;
    this.municipiosNacimiento.set([]);
    const idEntidad = entidadRnpspId(this.entidades(), String(this.form().get('entidadNacimiento')?.value || ''));
    if (!this.isMexico()) return;
    if (idEntidad === null) {
      if (this.form().get('entidadNacimiento')?.value && this.entidades().length)
        this.catalogError.set('La entidad seleccionada no contiene un identificador RNPSP válido para consultar municipios.');
      return;
    }
    try {
      const municipios = await this.catalogos.municipiosRnpsp(idEntidad);
      if (request === this.municipioRequest) this.municipiosNacimiento.set(municipios);
    } catch {
      if (request === this.municipioRequest) this.catalogError.set('No se pudieron cargar los municipios de nacimiento.');
    }
  }

  private async loadCatalogos(): Promise<void> {
    this.catalogError.set('');
    const results = await Promise.allSettled([
      this.catalogos.sexo(),
      this.catalogos.identidadGenero(),
      this.catalogos.pais(),
      this.catalogos.estadoCivil(),
      this.catalogos.tipoVulnerabilidad(),
      this.catalogos.preferirNuevo('nacionalidad', 1),
      this.catalogos.preferirNuevo('tipo-sangre', 2),
      this.catalogos.factoresSangreRnpsp(),
      this.catalogos.entidadesRnpsp()
    ]);

    if (results[0].status === 'fulfilled') this.sexos.set(results[0].value);
    if (results[1].status === 'fulfilled') this.identidadesGenero.set(results[1].value);
    if (results[2].status === 'fulfilled') this.paises.set(results[2].value);
    this.onCountryChange();
    if (results[3].status === 'fulfilled') this.estadosCiviles.set(results[3].value);
    if (results[4].status === 'fulfilled') this.vulnerabilidades.set(results[4].value);
    if (results[5].status === 'fulfilled') this.nacionalidadesRnpsp.set(results[5].value);
    if (results[6].status === 'fulfilled') this.tiposSangre.set(results[6].value);
    if (results[7].status === 'fulfilled') this.factoresSangre.set(results[7].value);
    if (results[8].status === 'fulfilled') this.entidades.set(results[8].value);
    await this.loadMunicipiosNacimiento();

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

  removeLicenseFile(): void {
    this.form().patchValue({documentoLicenciaNombre: '', documentoLicenciaDataUrl: ''});
    this.licenseError.set('');
  }
  viewLicenseFile(): void {
    const url = String(this.form().get('documentoLicenciaDataUrl')?.value || '');
    if (!url.startsWith('data:')) return;
    const viewer = window.open('', '_blank');
    if (!viewer) { this.licenseError.set('Permita ventanas emergentes para visualizar el documento.'); return; }
    if (url.startsWith('data:application/pdf')) viewer.location.href = url;
    else {
      const img = viewer.document.createElement('img');
      img.src = url; img.alt = 'Documento de licencia'; img.style.maxWidth = '100%';
      viewer.document.body.appendChild(img);
    }
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

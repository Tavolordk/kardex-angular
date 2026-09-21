import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-identificacion-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './identificacion-form.component.html',
  styleUrls: ['../form-sections.scss', './identificacion-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentificacionFormComponent {
  readonly form = input.required<FormGroup>();
  readonly licenseError = signal('');

  readonly vulnerableGroups = [
    'Ninguno',
    'Persona con discapacidad',
    'Persona indígena',
    'Persona afromexicana',
    'Persona adulta mayor',
    'Persona de la diversidad sexual',
    'Otro'
  ];

  hasVulnerableGroup(group: string): boolean {
    const selected = this.form().get('gruposVulnerables')?.value as string[] | null;
    return selected?.includes(group) ?? false;
  }

  toggleVulnerableGroup(group: string, checked: boolean): void {
    const control = this.form().get('gruposVulnerables');
    const current = [...((control?.value as string[] | null) ?? [])];

    let next = checked ? [...new Set([...current, group])] : current.filter(item => item !== group);
    if (group === 'Ninguno' && checked) next = ['Ninguno'];
    if (group !== 'Ninguno' && checked) next = next.filter(item => item !== 'Ninguno');

    control?.setValue(next);
    control?.markAsDirty();
  }

  onLicenseModeChange(value: 'si' | 'no'): void {
    this.form().get('licenciaConducir')?.setValue(value);
    if (value === 'no') {
      this.form().patchValue({
        numeroLicencia: '',
        documentoLicenciaNombre: '',
        documentoLicenciaDataUrl: ''
      });
      this.licenseError.set('');
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
    if (file.size > 5 * 1024 * 1024) {
      this.licenseError.set('El documento debe pesar máximo 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.form().patchValue({
      documentoLicenciaNombre: file.name,
      documentoLicenciaDataUrl: String(reader.result ?? '')
    });
    reader.readAsDataURL(file);
  }

  removeLicenseFile(): void {
    this.form().patchValue({ documentoLicenciaNombre: '', documentoLicenciaDataUrl: '' });
    this.licenseError.set('');
  }
}

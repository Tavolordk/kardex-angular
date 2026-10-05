import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ASSETS } from '../../../../../core/constants/assets';

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
  readonly assets = ASSETS;

  readonly vulnerableGroups = [
    'Pueblo o comunidad indígena',
    'Persona afrodescendiente o afromexicana',
    'Persona con discapacidad',
    'Comunidad LGBTIQ+'
  ];

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

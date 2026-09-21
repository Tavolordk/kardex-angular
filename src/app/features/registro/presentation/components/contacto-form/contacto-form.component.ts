import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmergencyContact } from '../../../domain/models/registro.model';

@Component({
  selector: 'app-contacto-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contacto-form.component.html',
  styleUrls: ['../form-sections.scss', './contacto-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactoFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = input.required<FormGroup>();
  readonly modalOpen = signal(false);
  readonly editingIndex = signal<number | null>(null);

  readonly contactForm = this.fb.group({
    nombre: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.minLength(10)]],
    parentesco: ['', Validators.required]
  });

  contacts(): EmergencyContact[] {
    return (this.form().get('contactosEmergencia')?.value as EmergencyContact[] | null) ?? [];
  }

  openNew(): void {
    this.editingIndex.set(null);
    this.contactForm.reset({ nombre: '', telefono: '', parentesco: '' });
    this.modalOpen.set(true);
  }

  openEdit(index: number): void {
    const contact = this.contacts()[index];
    if (!contact) return;
    this.editingIndex.set(index);
    this.contactForm.reset({ nombre: contact.nombre, telefono: contact.telefono, parentesco: contact.parentesco });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingIndex.set(null);
  }

  saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const value = this.contactForm.getRawValue();
    const current = [...this.contacts()];
    const index = this.editingIndex();

    if (index === null) {
      current.push({ id: `contact-${Date.now()}`, ...value });
    } else {
      current[index] = { ...current[index], ...value };
    }

    const control = this.form().get('contactosEmergencia');
    control?.setValue(current);
    control?.markAsDirty();
    this.closeModal();
  }

  deleteContact(index: number): void {
    const current = this.contacts().filter((_, currentIndex) => currentIndex !== index);
    const control = this.form().get('contactosEmergencia');
    control?.setValue(current);
    control?.markAsDirty();
  }
}

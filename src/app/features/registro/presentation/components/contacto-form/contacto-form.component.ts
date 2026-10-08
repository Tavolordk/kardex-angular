import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { EmergencyContact, NormalContact } from '../../../domain/models/registro.model';

@Component({
  selector: 'app-contacto-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputCaseDirective],
  templateUrl: './contacto-form.component.html',
  styleUrls: ['../form-sections.scss', './contacto-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactoFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = input.required<FormGroup>();

  readonly primaryEditingIndex = signal<number | null>(null);
  readonly modalOpen = signal(false);
  readonly editingIndex = signal<number | null>(null);

  readonly contactForm = this.fb.group({
    nombre: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    parentesco: ['', Validators.required]
  });

  primaryContacts(): NormalContact[] {
    return (this.form().get('contactos')?.value as NormalContact[] | null) ?? [];
  }

  contacts(): EmergencyContact[] {
    return (this.form().get('contactosEmergencia')?.value as EmergencyContact[] | null) ?? [];
  }

  savePrimaryContact(): void {
    const telefonoControl = this.form().get('telefono');
    const correoControl = this.form().get('correo');
    const telefono = String(telefonoControl?.value ?? '').replace(/\D/g, '').slice(0, 10);
    const correo = String(correoControl?.value ?? '').trim().toLowerCase();
    telefonoControl?.setValue(telefono);
    correoControl?.setValue(correo);

    if (!/^\d{10}$/.test(telefono) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      telefonoControl?.markAsTouched();
      correoControl?.markAsTouched();
      return;
    }

    const current = [...this.primaryContacts()];
    const index = this.primaryEditingIndex();
    const item: NormalContact = { id: index === null ? `normal-${Date.now()}` : current[index].id, telefono, correo };
    if (index === null) current.push(item); else current[index] = item;
    const control = this.form().get('contactos');
    control?.setValue(current); control?.markAsDirty();
    this.cancelPrimaryEdit();
  }

  editPrimaryContact(index: number): void {
    const contact = this.primaryContacts()[index];
    if (!contact) return;
    this.primaryEditingIndex.set(index);
    this.form().patchValue({ telefono: contact.telefono, correo: contact.correo });
  }

  deletePrimaryContact(index: number): void {
    const current = this.primaryContacts().filter((_, i) => i !== index);
    const control = this.form().get('contactos');
    control?.setValue(current); control?.markAsDirty();
    if (this.primaryEditingIndex() === index) this.cancelPrimaryEdit();
  }

  cancelPrimaryEdit(): void {
    this.primaryEditingIndex.set(null);
    this.form().patchValue({ telefono: '', correo: '' });
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

  closeModal(): void { this.modalOpen.set(false); this.editingIndex.set(null); }

  saveContact(): void {
    if (this.contactForm.invalid) { this.contactForm.markAllAsTouched(); return; }
    const value = this.contactForm.getRawValue();
    const current = [...this.contacts()];
    const index = this.editingIndex();
    if (index === null) current.push({ id: `contact-${Date.now()}`, ...value });
    else current[index] = { ...current[index], ...value };
    const control = this.form().get('contactosEmergencia');
    control?.setValue(current); control?.markAsDirty();
    this.closeModal();
  }

  deleteContact(index: number): void {
    const current = this.contacts().filter((_, i) => i !== index);
    const control = this.form().get('contactosEmergencia');
    control?.setValue(current); control?.markAsDirty();
  }
}

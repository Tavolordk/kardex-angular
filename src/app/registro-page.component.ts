import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

type StepKey = 'basica' | 'origen' | 'contacto' | 'foto';
interface Step { key: StepKey; title: string; state: string; icon: string; }

@Component({
  selector: 'app-registro-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-page.component.html',
  styleUrl: './registro-page.component.scss'
})
export class RegistroPageComponent {
  readonly sidebarOpen = signal(true);
  readonly activeStep = signal<StepKey>('basica');
  readonly saved = signal(false);
  readonly photoName = signal<string>('');

  readonly steps: Step[] = [
    { key: 'basica', title: 'Identificación básica', state: 'En captura', icon: '▣' },
    { key: 'origen', title: 'Origen y residencia', state: 'Disponible', icon: '⌖' },
    { key: 'contacto', title: 'Contacto', state: 'Disponible', icon: '♟' },
    { key: 'foto', title: 'Fotografía y biométricos', state: 'Disponible', icon: '◉' }
  ];

  readonly stepIndex = computed(() => this.steps.findIndex(s => s.key === this.activeStep()));
  readonly currentStep = computed(() => this.steps[this.stepIndex()]);

  readonly form = this.fb.group({
    curp: [''], nombres: [''], primerApellido: [''], segundoApellido: [''],
    fechaNacimiento: [''], sexo: [''], identidadGenero: [''], nacionalidad: [''],
    entidadNacimiento: [''], municipioNacimiento: [''], estadoCivil: [''], vulnerabilidad: [''], dependientes: [''],
    entidadResidencia: [''], municipioResidencia: [''], calle: [''], numeroExterior: [''], numeroInterior: [''], colonia: [''], codigoPostal: [''],
    telefono: [''], correo: [''], contactoEmergencia: [''], telefonoEmergencia: [''],
    fechaToma: [''], biometrico: ['si'], identificador: ['CURP-BIO-9923847-X']
  });

  constructor(private readonly fb: FormBuilder) {}

  setStep(key: StepKey) { this.activeStep.set(key); this.saved.set(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  next() { const i = this.stepIndex(); if (i < this.steps.length - 1) this.setStep(this.steps[i + 1].key); }
  prev() { const i = this.stepIndex(); if (i > 0) this.setStep(this.steps[i - 1].key); }
  saveDraft() { this.saved.set(true); setTimeout(() => this.saved.set(false), 2200); }
  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  onPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.photoName.set(file.name);
  }
}

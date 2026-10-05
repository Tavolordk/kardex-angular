import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ASSETS } from '../../../../../core/constants/assets';
import { GetCurrentSessionUseCase } from '../../../../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../../../../auth/application/sign-out.use-case';
import { InstitutionalHeaderComponent } from '../../../../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../../../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../../../../shared/ui/section-header/section-header.component';
import { HelpPanelComponent } from '../../../../../shared/ui/help-panel/help-panel.component';
import { StepNavigationComponent } from '../../../../../shared/ui/step-navigation/step-navigation.component';
import { UtilityDockComponent } from '../../../../../shared/ui/utility-dock/utility-dock.component';
import {
  HelperPanelDockItem,
  HelperPanelKey,
  HelperPanelVisibility
} from '../../../../../shared/ui/helper-panel.model';
import { RegistroDraftFacade } from '../../../application/registro-draft.facade';
import { EMPTY_REGISTRO_DRAFT, RegistroDraft, RegistroStepKey } from '../../../domain/models/registro.model';
import { RegistroStep, SectionProgress } from '../../../domain/models/registro-step.model';
import { RegistroRepository } from '../../../domain/repositories/registro.repository';
import { LocalStorageRegistroRepository } from '../../../infrastructure/local-storage-registro.repository';
import { IdentificacionFormComponent } from '../../components/identificacion-form/identificacion-form.component';
import { OrigenResidenciaFormComponent } from '../../components/origen-residencia-form/origen-residencia-form.component';
import { ContactoFormComponent } from '../../components/contacto-form/contacto-form.component';
import { FotografiaFormComponent } from '../../components/fotografia-form/fotografia-form.component';
import { ReclutamientoHistorialComponent } from '../../components/reclutamiento-historial/reclutamiento-historial.component';
import { CertificacionHistorialComponent } from '../../components/certificacion-historial/certificacion-historial.component';

interface StepPresentation extends RegistroStep {
  formTitle: string;
  description: string;
}

const DEFAULT_HELPER_VISIBILITY: HelperPanelVisibility = {
  instructions: true,
  sectionProgress: true,
  generalProgress: true,
  recommendation: true
};

@Component({
  selector: 'app-registro-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InstitutionalHeaderComponent,
    SidebarComponent,
    SectionHeaderComponent,
    HelpPanelComponent,
    StepNavigationComponent,
    UtilityDockComponent,
    IdentificacionFormComponent,
    OrigenResidenciaFormComponent,
    ContactoFormComponent,
    FotografiaFormComponent,
    ReclutamientoHistorialComponent,
    CertificacionHistorialComponent
  ],
  providers: [RegistroDraftFacade, { provide: RegistroRepository, useClass: LocalStorageRegistroRepository }],
  templateUrl: './registro-page.component.html',
  styleUrl: './registro-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly signOutUseCase = inject(SignOutUseCase);
  private readonly getSessionUseCase = inject(GetCurrentSessionUseCase);
  private readonly helperStorageKey = 'kardex.helper-panels.v1';

  readonly facade = inject(RegistroDraftFacade);
  readonly assets = ASSETS;
  readonly session = this.getSessionUseCase.execute();
  readonly sidebarOpen = signal(typeof window === 'undefined' ? true : window.innerWidth > 900);
  readonly photoError = signal('');
  readonly activeSection = signal<'datos' | 'reclutamiento' | 'certificacion'>('datos');
  readonly helperVisibility = signal<HelperPanelVisibility>({ ...DEFAULT_HELPER_VISIBILITY });

  readonly form = this.fb.group({
    curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
    cuip: [''],
    numeroNomina: ['', Validators.required],
    nombres: ['', Validators.required],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    fechaNacimiento: ['', Validators.required],
    sexo: ['', Validators.required],
    identidadGenero: [''],
    nacionalidad: ['', Validators.required],
    entidadNacimiento: ['', Validators.required],
    municipioNacimiento: ['', Validators.required],
    estadoCivil: ['', Validators.required],
    licenciaConducir: ['no' as 'si' | 'no', Validators.required],
    numeroLicencia: [''],
    documentoLicenciaNombre: [''],
    documentoLicenciaDataUrl: [''],
    gruposVulnerables: this.fb.control<string[]>([]),
    dependientes: [''],
    entidadResidencia: ['', Validators.required],
    municipioResidencia: ['', Validators.required],
    calle: ['', Validators.required],
    numeroExterior: [''],
    numeroInterior: [''],
    colonia: [''],
    codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    telefono: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contactosEmergencia: this.fb.control<RegistroDraft['contactosEmergencia']>([]),
    fechaToma: ['', Validators.required],
    vigenciaFotografia: ['3 años desde la fecha de toma', Validators.required],
    origenCaptura: ['Expediente de ingreso', Validators.required],
    biometrico: ['si' as 'si' | 'no', Validators.required],
    photoDataUrl: [''],
    photoName: ['']
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly steps: StepPresentation[] = [
    {
      key: 'identificacion',
      title: 'Identificación básica',
      formTitle: 'Datos personales',
      requiredCount: 0,
      icon: ASSETS.icons.identification,
      description: 'Identificación oficial y datos sociodemográficos de la persona servidora pública.'
    },
    {
      key: 'origen',
      title: 'Residencia',
      formTitle: 'Residencia',
      requiredCount: 4,
      icon: ASSETS.icons.origin,
      description: 'Información del domicilio actual de la persona servidora pública.'
    },
    {
      key: 'contacto',
      title: 'Contacto',
      formTitle: 'Contacto',
      requiredCount: 2,
      icon: ASSETS.icons.contact,
      description: 'Medios de contacto y contacto de emergencia.'
    },
    {
      key: 'fotografia',
      title: 'Fotografía y biométricos',
      formTitle: 'Fotografía y biometricos',
      requiredCount: 1,
      icon: ASSETS.icons.camera,
      description: 'Fotografía vigente de la persona servidora pública e indicador de su registro biométrico.'
    }
  ];

  private readonly requiredByStep: Record<RegistroStepKey, (keyof RegistroDraft)[]> = {
    identificacion: ['curp', 'numeroNomina', 'nombres', 'primerApellido', 'fechaNacimiento', 'sexo', 'nacionalidad', 'entidadNacimiento', 'municipioNacimiento', 'estadoCivil'],
    origen: ['entidadResidencia', 'municipioResidencia', 'calle', 'codigoPostal'],
    contacto: ['telefono', 'correo'],
    fotografia: ['photoDataUrl']
  };

  readonly sectionProgress = computed<SectionProgress[]>(() => {
    const value = this.formValue() as RegistroDraft;
    return [
      { key: 'identificacion', label: 'Datos personales', percentage: this.percent(value, this.requiredByStep.identificacion) },
      { key: 'origen', label: 'Residencia', percentage: this.percent(value, this.requiredByStep.origen) },
      { key: 'contacto', label: 'Contacto', percentage: this.percent(value, this.requiredByStep.contacto) },
      { key: 'fotografia', label: 'Fotografía y biométricos', percentage: this.percent(value, this.requiredByStep.fotografia) }
    ];
  });

  readonly generalProgress = computed(() =>
    Math.round(this.sectionProgress().reduce((sum, item) => sum + item.percentage, 0) / this.sectionProgress().length)
  );

  readonly displayedSectionProgress = computed<SectionProgress[]>(() => {
    if (this.activeSection() === 'reclutamiento') {
      return [{ key: 'reclutamiento', label: 'Reclutamiento y selección', percentage: 0 }];
    }
    if (this.activeSection() === 'certificacion') {
      return [{ key: 'certificacion', label: 'Certificación', percentage: 0 }];
    }
    return this.sectionProgress();
  });

  readonly displayedGeneralProgress = computed(() =>
    this.activeSection() === 'datos' ? this.generalProgress() : 0
  );

  readonly sectionHeaderTitle = computed(() => {
    if (this.activeSection() === 'reclutamiento') return 'Reclutamiento y selección';
    if (this.activeSection() === 'certificacion') return 'Certificación';
    return this.facade.activeStep() === 'fotografia' ? 'Registro' : 'Datos personales';
  });

  readonly sectionHeaderSubtitle = computed(() => {
    if (this.activeSection() === 'reclutamiento') {
      return 'Historial, estatus y resolución del trámite de incorporación institucional.';
    }
    if (this.activeSection() === 'certificacion') {
      return 'Estatus de evaluaciones oficiales, vigencias y competencias laborales.';
    }
    return 'Captura inicial de información del personal policial';
  });

  readonly completed = computed<Record<RegistroStepKey, boolean>>(() => ({
    identificacion: this.sectionProgress()[0].percentage === 100,
    origen: this.sectionProgress()[1].percentage === 100,
    contacto: this.sectionProgress()[2].percentage === 100,
    fotografia: this.sectionProgress()[3].percentage === 100
  }));

  readonly activeIndex = computed(() => this.steps.findIndex(step => step.key === this.facade.activeStep()));
  readonly activeMeta = computed(() => this.steps[this.activeIndex()]);
  readonly photoUrl = computed(() => (this.formValue() as RegistroDraft).photoDataUrl || '');
  readonly photoName = computed(() => (this.formValue() as RegistroDraft).photoName || '');

  readonly hasVisiblePanels = computed(() => Object.values(this.helperVisibility()).some(Boolean));

  readonly dockItems = computed<HelperPanelDockItem[]>(() => {
    const visible = this.helperVisibility();
    return [
      { key: 'instructions', label: 'Instrucciones', icon: ASSETS.icons.instructions, visible: visible.instructions },
      { key: 'sectionProgress', label: 'Por sección', icon: ASSETS.icons.progress, visible: visible.sectionProgress },
      { key: 'generalProgress', label: 'Progreso', icon: ASSETS.icons.section, visible: visible.generalProgress },
      { key: 'recommendation', label: 'Recomendación', icon: ASSETS.icons.recommendation, visible: visible.recommendation }
    ];
  });

  async ngOnInit(): Promise<void> {
    this.restoreHelperVisibility();
    const draft = await this.facade.loadDraft();
    if (draft) this.form.patchValue({ ...EMPTY_REGISTRO_DRAFT, ...draft });
  }

  setStep(step: RegistroStepKey): void {
    this.facade.setStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previous(): void {
    if (this.activeSection() === 'certificacion') {
      this.activeSection.set('reclutamiento');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (this.activeSection() === 'reclutamiento') {
      this.activeSection.set('datos');
      this.setStep('fotografia');
      return;
    }
    const index = this.activeIndex();
    if (index > 0) this.setStep(this.steps[index - 1].key);
  }

  next(): void {
    if (this.activeSection() === 'certificacion') return;
    if (this.activeSection() === 'reclutamiento') {
      this.activeSection.set('certificacion');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const index = this.activeIndex();
    if (index < this.steps.length - 1) {
      this.setStep(this.steps[index + 1].key);
      return;
    }
    this.activeSection.set('reclutamiento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  async saveDraft(): Promise<void> {
    // El correo es la única excepción a la captura en mayúsculas.
    // Se normaliza nuevamente al persistir para no depender solo de la UI.
    const correoControl = this.form.controls.correo;
    const normalizedEmail = correoControl.value.trim().toLowerCase();
    if (normalizedEmail !== correoControl.value) {
      correoControl.setValue(normalizedEmail, { emitEvent: false });
    }

    await this.facade.saveDraft(this.form.getRawValue() as RegistroDraft);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  closeMobileSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.sidebarOpen.set(false);
    }
  }

  hideHelperPanel(key: HelperPanelKey): void {
    this.setHelperPanelVisibility(key, false);
  }

  toggleHelperPanel(key: HelperPanelKey): void {
    this.setHelperPanelVisibility(key, !this.helperVisibility()[key]);
  }

  onPhotoSelected(file: File): void {
    this.photoError.set('');
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.photoError.set('Solo se permiten archivos JPG o PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError.set('La fotografía debe pesar máximo 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.form.patchValue({ photoDataUrl: String(reader.result ?? ''), photoName: file.name });
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.form.patchValue({ photoDataUrl: '', photoName: '' });
    this.photoError.set('');
  }

  async logout(): Promise<void> {
    try {
      await this.signOutUseCase.execute();
    } finally {
      await this.router.navigate(['/login']);
    }
  }

  private setHelperPanelVisibility(key: HelperPanelKey, visible: boolean): void {
    this.helperVisibility.update(current => ({ ...current, [key]: visible }));
    this.persistHelperVisibility();
  }

  private restoreHelperVisibility(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(this.helperStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<HelperPanelVisibility>;
      this.helperVisibility.set({ ...DEFAULT_HELPER_VISIBILITY, ...parsed });
    } catch {
      this.helperVisibility.set({ ...DEFAULT_HELPER_VISIBILITY });
    }
  }

  private persistHelperVisibility(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(this.helperStorageKey, JSON.stringify(this.helperVisibility()));
    } catch {
      // El registro sigue funcionando aunque el navegador bloquee localStorage.
    }
  }

  private percent(value: RegistroDraft, keys: (keyof RegistroDraft)[]): number {
    const complete = keys.filter(key => {
      const current = value[key];
      if (Array.isArray(current)) return current.length > 0;
      return String(current ?? '').trim().length > 0;
    }).length;
    return Math.round((complete / keys.length) * 100);
  }
}

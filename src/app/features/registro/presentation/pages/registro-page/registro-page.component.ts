import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ASSETS } from '../../../../../core/constants/assets';
import { GetCurrentSessionUseCase } from '../../../../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../../../../auth/application/sign-out.use-case';
import { KardexFlowService } from '../../../../../core/navigation/kardex-flow.service';
import { InstitutionalHeaderComponent } from '../../../../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../../../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../../../../shared/ui/section-header/section-header.component';
import { HelpPanelComponent } from '../../../../../shared/ui/help-panel/help-panel.component';
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
import { HttpRegistroRepository } from '../../../infrastructure/http-registro.repository';
import { IdentificacionFormComponent } from '../../components/identificacion-form/identificacion-form.component';
import { OrigenResidenciaFormComponent } from '../../components/origen-residencia-form/origen-residencia-form.component';
import { ContactoFormComponent } from '../../components/contacto-form/contacto-form.component';
import { FotografiaFormComponent } from '../../components/fotografia-form/fotografia-form.component';
import { ReclutamientoHistorialComponent } from '../../components/reclutamiento-historial/reclutamiento-historial.component';
import { CertificacionHistorialComponent } from '../../components/certificacion-historial/certificacion-historial.component';
import { ControlConfianzaHistorialComponent } from '../../components/control-confianza-historial/control-confianza-historial.component';
import { CondicionesLaboralesComponent } from '../../components/condiciones-laborales/condiciones-laborales.component';

interface StepPresentation extends RegistroStep {
  formTitle: string;
  description: string;
}

type SectionKey = 'datos' | 'reclutamiento' | 'condiciones-laborales' | 'control-confianza' | 'certificacion-individual';

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
    UtilityDockComponent,
    IdentificacionFormComponent,
    OrigenResidenciaFormComponent,
    ContactoFormComponent,
    FotografiaFormComponent,
    ReclutamientoHistorialComponent,
    CertificacionHistorialComponent,
    ControlConfianzaHistorialComponent,
    CondicionesLaboralesComponent
  ],
  providers: [RegistroDraftFacade, LocalStorageRegistroRepository, { provide: RegistroRepository, useClass: HttpRegistroRepository }],
  templateUrl: './registro-page.component.html',
  styleUrl: './registro-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly signOutUseCase = inject(SignOutUseCase);
  readonly flow = inject(KardexFlowService);
  private readonly getSessionUseCase = inject(GetCurrentSessionUseCase);
  private readonly helperStorageKey = 'kardex.helper-panels.v1';

  readonly facade = inject(RegistroDraftFacade);
  readonly assets = ASSETS;
  readonly session = this.getSessionUseCase.execute();
  readonly sidebarOpen = signal(typeof window === 'undefined' ? true : window.innerWidth > 900);
  readonly photoError = signal('');
  readonly navigationError = signal('');
  readonly sectionFinished = signal(false);
  readonly draftReady = signal(false);
  readonly recruitmentPanel = viewChild(ReclutamientoHistorialComponent);
  readonly conditionsPanel = viewChild(CondicionesLaboralesComponent);
  readonly activeSection = signal<SectionKey>('datos');
  readonly sections: ReadonlyArray<{ key: SectionKey; label: string }> = [
    { key: 'datos', label: 'Datos personales' },
    { key: 'reclutamiento', label: 'Reclutamiento y selección' },
    { key: 'condiciones-laborales', label: 'Condiciones laborales y prestaciones' },
    { key: 'control-confianza', label: 'Control de confianza' },
    { key: 'certificacion-individual', label: 'Certificación individual' }
  ];
  readonly helperVisibility = signal<HelperPanelVisibility>({ ...DEFAULT_HELPER_VISIBILITY });
  readonly nextSectionLabel = computed(() => {
    const index = this.sections.findIndex(section => section.key === this.activeSection());
    return this.sections[index + 1]?.label ?? '';
  });

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
    nacionalidadRnpsp: [''],
    tipoSangre: [''],
    factorSangre: [''],
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
    correo: ['', [Validators.email]],
    contactos: this.fb.control<RegistroDraft['contactos']>([]),
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
    contacto: ['contactos'],
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
    if (this.activeSection() === 'condiciones-laborales') {
      return [{ key: 'condiciones-laborales', label: 'Condiciones laborales y prestaciones', percentage: 0 }];
    }
    if (this.activeSection() === 'control-confianza') {
      return [{ key: 'control-confianza', label: 'Control de confianza', percentage: 0 }];
    }
    if (this.activeSection() === 'certificacion-individual') {
      return [{ key: 'certificacion-individual', label: 'Certificación individual', percentage: 0 }];
    }
    return this.sectionProgress();
  });

  readonly displayedGeneralProgress = computed(() =>
    this.activeSection() === 'datos' ? this.generalProgress() : 0
  );

  readonly sectionHeaderTitle = computed(() => {
    if (this.activeSection() === 'reclutamiento') return 'Reclutamiento y selección';
    if (this.activeSection() === 'condiciones-laborales') return 'Condiciones laborales y prestaciones';
    if (this.activeSection() === 'control-confianza') return 'Control de confianza';
    if (this.activeSection() === 'certificacion-individual') return 'Certificación individual';
    return this.facade.activeStep() === 'fotografia' ? 'Registro' : 'Datos personales';
  });

  readonly sectionHeaderSubtitle = computed(() => {
    if (this.activeSection() === 'reclutamiento') {
      return 'Historial, estatus y resolución del trámite de incorporación institucional.';
    }
    if (this.activeSection() === 'condiciones-laborales') {
      return 'Ubicación operativa, relación laboral, percepciones y beneficios institucionales.';
    }
    if (this.activeSection() === 'control-confianza') {
      return 'Historial de evaluaciones de control de confianza, resultados y vigencias.';
    }
    if (this.activeSection() === 'certificacion-individual') {
      return 'Historial de certificaciones individuales y competencias acreditadas.';
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
    // Acceso directo desde las tarjetas del nuevo menú Figma.
    // Solo admite secciones que ya están implementadas en el proyecto.
    const requested = this.activatedRoute.snapshot.queryParamMap.get('seccion');
    const section = this.sections.find(item => item.key === requested);
    if (section) this.activeSection.set(section.key);
    // Al volver desde el menú, retomar el primer formulario pendiente sin
    // presentar otra lista de pasos ni obligar a repetir los ya completados.
    if (this.activeSection() === 'datos' && draft) {
      const pending = this.sectionProgress().findIndex(item => item.percentage < 100);
      if (pending > 0) this.facade.setStep(this.steps[pending].key);
    }
    // Los paneles que antes leían localStorage en su constructor se crean DESPUÉS del GET.
    this.draftReady.set(true);
  }

  /** Las tarjetas del menú permiten abrir cada apartado de forma independiente.
   * Dentro de Datos personales sí se validan los campos antes de pasar al siguiente formulario. */
  private invalidFields(step: RegistroStepKey): (keyof RegistroDraft)[] {
    const fields: (keyof RegistroDraft)[] = [...this.requiredByStep[step]];
    if (step === 'identificacion') {
      const nationality = this.form.controls.nacionalidad.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      if (nationality && !nationality.includes('MEX')) {
        for (const field of ['entidadNacimiento', 'municipioNacimiento'] as const) {
          const index = fields.indexOf(field);
          if (index !== -1) fields.splice(index, 1);
        }
      }
      if (this.form.controls.licenciaConducir.value === 'si') {
        fields.push('numeroLicencia', 'documentoLicenciaDataUrl');
      }
    }
    const missing = fields.filter(key => {
      const control = this.form.get(key);
      const value = control?.value;
      const empty = Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
      if (empty || control?.invalid) control?.markAsTouched();
      return empty || !!control?.invalid;
    });
    if (step === 'fotografia' && this.photoError()) missing.push('photoDataUrl');
    return missing;
  }

  private validateCurrentStep(): boolean {
    const missing = this.invalidFields(this.facade.activeStep());
    if (missing.length) {
      this.navigationError.set(`Complete los ${missing.length} campos obligatorios antes de continuar. Revise los campos marcados.`);
      return false;
    }
    this.navigationError.set('');
    return true;
  }

  /** No se ofrecen listas de pasos navegables: solamente Anterior y Continuar. */
  previous(): void {
    if (this.activeSection() !== 'datos') return;
    const index = this.activeIndex();
    if (index > 0) {
      this.navigationError.set('');
      this.facade.setStep(this.steps[index - 1].key);
      this.scrollToTop();
    }
  }

  async next(): Promise<void> {
    if (this.activeSection() !== 'datos' || this.facade.isSaving()) return;
    if (this.activeIndex() === this.steps.length - 1) {
      await this.finishSection();
      return;
    }
    if (!this.validateCurrentStep()) return;
    await this.saveDraft();
    if (this.facade.saveState() !== 'saved') {
      this.navigationError.set('No se pudo guardar el avance. Inténtelo de nuevo antes de continuar.');
      return;
    }
    this.facade.setStep(this.steps[this.activeIndex() + 1].key);
    this.navigationError.set('');
    this.scrollToTop();
  }

  /** Confirma el fin del apartado sin abrir automáticamente otro formulario.
   * Los historiales ECCC y de certificación son de consulta; no se marcan
   * artificialmente como completos. */
  async finishSection(): Promise<void> {
    if (this.facade.isSaving()) return;
    this.navigationError.set('');
    const section = this.activeSection();
    if (section === 'datos') {
      for (const step of this.steps) {
        const missing = this.invalidFields(step.key);
        if (missing.length) {
          this.facade.setStep(step.key);
          this.navigationError.set(`Faltan ${missing.length} campos obligatorios en ${step.title}. Complete los campos marcados.`);
          this.scrollToTop();
          return;
        }
      }
      await this.saveDraft();
      if (this.facade.saveState() !== 'saved') {
        this.navigationError.set('No fue posible guardar Datos personales. Vuelva a intentarlo.');
        return;
      }
    } else if (section === 'reclutamiento') {
      if (!this.recruitmentPanel()?.processes().length) {
        this.navigationError.set('Agregue al menos un proceso de reclutamiento válido para finalizar este apartado.');
        return;
      }
    } else if (section === 'condiciones-laborales') {
      if (!this.conditionsPanel()?.validateForAdvance()) {
        this.navigationError.set('Complete la adscripción y las condiciones laborales obligatorias antes de finalizar.');
        return;
      }
    } else {
      return;
    }
    if (section !== 'datos') {
      await this.saveDraft();
      if (this.facade.saveState() !== 'saved') {
        this.navigationError.set('El apartado está completo, pero el servidor no confirmó el guardado. Inténtelo nuevamente.');
        return;
      }
    }
    if (section === 'datos') {
      // La validación inicial es el siguiente destino, nunca el menú.
      this.flow.invalidateReview();
      await this.router.navigateByUrl('/validacion-inicial');
      return;
    }
    this.sectionFinished.set(true);
    this.scrollToTop();
  }

  /** La navegación entre apartados se ofrece únicamente tras la confirmación,
   * o para consultar certificación desde Control de confianza. */
  continueToNext(): void {
    if (this.activeSection() === 'datos') {
      void this.router.navigateByUrl('/validacion-inicial');
      return;
    }
    const current = this.sections.findIndex(section => section.key === this.activeSection());
    const nextSection = this.sections[current + 1];
    if (!nextSection) {
      void this.goToMenu();
      return;
    }
    this.sectionFinished.set(false);
    this.navigationError.set('');
    this.activeSection.set(nextSection.key);
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { seccion: nextSection.key },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.scrollToTop();
  }

  /** Si se regresa desde Datos personales, conserva también el borrador parcial. */
  async goToMenu(): Promise<void> {
    if (this.facade.isSaving()) return;
    if (['datos', 'reclutamiento', 'condiciones-laborales'].includes(this.activeSection()) && !this.sectionFinished()) {
      await this.saveDraft();
      if (this.facade.saveState() !== 'saved') {
        this.navigationError.set('No fue posible guardar el borrador. Inténtelo nuevamente antes de salir.');
        return;
      }
    }
    const completed = this.sectionFinished() ? this.activeSection() : null;
    await this.router.navigate([this.flow.hasSelectedProfile() ? '/menu' : '/registro'], {
      queryParams: completed ? { completada: completed } : undefined
    });
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async saveDraft(): Promise<void> {
    if (this.facade.isSaving()) return;
    if (this.activeSection() === 'condiciones-laborales') this.conditionsPanel()?.captureDraft();
    // El correo es la única excepción a la captura en mayúsculas.
    // Se normaliza nuevamente al persistir para no depender solo de la UI.
    const correoControl = this.form.controls.correo;
    const normalizedEmail = correoControl.value.trim().toLowerCase();
    if (normalizedEmail !== correoControl.value) {
      correoControl.setValue(normalizedEmail, { emitEvent: false });
    }
    const contactosControl = this.form.controls.contactos;
    contactosControl.setValue(
      (contactosControl.value ?? []).map(contacto => ({ ...contacto, correo: contacto.correo.trim().toLowerCase() })),
      { emitEvent: false }
    );

    const section = this.activeSection() === 'reclutamiento' ? 'reclutamientoSeleccion'
      : this.activeSection() === 'condiciones-laborales' ? 'condicionesLaborales' : 'datosPersonales';
    await this.facade.saveDraft(this.form.getRawValue() as RegistroDraft, section);
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
      if (typeof window !== 'undefined') window.sessionStorage.removeItem('kardex.modulos.v1.' + encodeURIComponent(this.session?.userId || 'invitado') + '.salud');
      this.flow.clear();
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

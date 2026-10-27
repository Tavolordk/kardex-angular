import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ASSETS } from '../../../../../core/constants/assets';
import { GetCurrentSessionUseCase } from '../../../../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../../../../auth/application/sign-out.use-case';
import { KardexFlowService } from '../../../../../core/navigation/kardex-flow.service';
import { InstitutionalHeaderComponent } from '../../../../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../../../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../../../../shared/ui/section-header/section-header.component';
import { RegistroDraft } from '../../../../registro/domain/models/registro.model';
import { HttpRegistroRepository } from '../../../../registro/infrastructure/http-registro.repository';
import { MODULOS, ModuloKey } from '../../../../expediente/domain/modulos.config';
import { KardexSaveApiService } from '../../../../registro/infrastructure/kardex-save-api.service';

type RegistrationSection = 'datos' | 'reclutamiento' | 'condiciones-laborales' | 'control-confianza' | 'certificacion-individual' | ModuloKey;

interface MenuCard {
  title: string;
  description: string;
  section?: RegistrationSection;
  action: 'Actualizar' | 'Consultar';
  readonly newModule?: boolean;
}

const DRAFT_KEY = 'kardex.registro.draft.v2';
const REQUIRED: readonly (readonly (keyof RegistroDraft)[])[] = [
  ['curp', 'numeroNomina', 'nombres', 'primerApellido', 'fechaNacimiento', 'sexo', 'nacionalidad', 'entidadNacimiento', 'municipioNacimiento', 'estadoCivil'],
  ['entidadResidencia', 'municipioResidencia', 'calle', 'codigoPostal'],
  ['contactos'],
  ['photoDataUrl']
];

/** Figma: KARDEX-compartido, nodo 731:658 (Menú navegación). */
@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [InstitutionalHeaderComponent, SidebarComponent, SectionHeaderComponent, RouterLink],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionUseCase = inject(GetCurrentSessionUseCase);
  private readonly signOutUseCase = inject(SignOutUseCase);
  private readonly flow = inject(KardexFlowService);
  private readonly borradorRepository = inject(HttpRegistroRepository);
  private readonly borradorApi = inject(KardexSaveApiService);

  readonly assets = ASSETS;
  readonly session = this.sessionUseCase.execute();
  readonly sidebarOpen = signal(typeof window !== 'undefined' && window.innerWidth > 900);
  readonly percentages = signal<Partial<Record<RegistrationSection, number>>>({});
  readonly completedMessage = signal('');
  readonly borradorId = signal<number | null>(null);
  readonly selectedCurp = this.flow.selectedCurp();
  readonly draftError = signal('');
  readonly draftLoading = signal(true);
  readonly deletingDraft = signal(false);
  readonly menuCards: readonly MenuCard[] = [
    { title: 'Datos Personales', description: 'Captura inicial de información de la persona servidora pública', section: 'datos', action: 'Actualizar' },
    { title: 'Reclutamiento y selección', description: 'Historial, estatus y resolución del trámite de incorporación institucional.', section: 'reclutamiento', action: 'Actualizar' },
    { title: 'Condiciones laborales y prestaciones', description: 'Ubicación operativa, relación laboral, percepciones y beneficios institucionales.', section: 'condiciones-laborales', action: 'Actualizar' },
    { title: 'Control de confianza', description: 'Resultado y vigencia de las evaluaciones de control de confianza de la persona', section: 'control-confianza', action: 'Consultar' },
    { title: 'Certificación individual', description: 'Certificado individual y estándares de competencia acreditados por la persona', section: 'certificacion-individual', action: 'Consultar' },
    { title: 'Formación académica', description: 'Historial académico, grados, cédulas e idiomas del personal.', section: 'formacion-academica', action: 'Actualizar', newModule: true },
    { title: 'Profesionalización', description: 'Formación inicial, continua y sus comprobantes.', section: 'profesionalizacion', action: 'Actualizar', newModule: true },
    { title: 'Estímulos/reconocimientos', description: 'Registro de bonificaciones, distinciones otorgadas.', section: 'estimulos', action: 'Actualizar', newModule: true },
    { title: 'Separación del cargo', description: 'Registro de la conclusión de la relación administrativa.', section: 'separacion', action: 'Actualizar', newModule: true },
    { title: 'Régimen disciplinario', description: 'Medidas preventivas, resoluciones y sanciones del personal.', section: 'regimen-disciplinario', action: 'Actualizar', newModule: true },
    { title: 'Salud y bienestar', description: 'Datos físicos, incapacidades y perfil psicosocial.', section: 'salud', action: 'Actualizar', newModule: true }
  ];

  async ngOnInit(): Promise<void> {
    this.readProgress();
    try {
      await this.borradorRepository.loadDraft();
      this.borradorId.set(this.borradorApi.idBorrador);
      this.readProgress();
    } catch (error) {
      this.draftError.set(error instanceof Error ? error.message : 'No fue posible recuperar el borrador del servidor.');
    } finally { this.draftLoading.set(false); }
    const key = this.route.snapshot.queryParamMap.get('completada');
    const card = this.menuCards.find(item => item.section === key);
    if (card && card.section && this.percent(card.section) === 100) {
      this.completedMessage.set(`${card.title}: información guardada correctamente.`);
    }
  }

  async discardDraft(): Promise<void> {
    if (this.deletingDraft() || !this.borradorId()) return;
    if (!window.confirm('¿Eliminar definitivamente el borrador del servidor y los datos locales capturados? Esta acción no se puede deshacer.')) return;
    this.deletingDraft.set(true);
    this.draftError.set('');
    try {
      await this.borradorRepository.clearDraft();
      localStorage.removeItem('kardex.demo.reclutamiento.v2');
      const scope = 'kardex.modulos.v1.' + encodeURIComponent(this.session?.userId || 'invitado') + '.';
      for (const key of Object.keys(localStorage)) if (key.startsWith('kardex.demo.laboral.') || key.startsWith(scope)) localStorage.removeItem(key);
      for (const key of Object.keys(sessionStorage)) if (key.startsWith(scope)) sessionStorage.removeItem(key);
      this.borradorId.set(null);
      this.flow.clear();
      this.completedMessage.set('Borrador eliminado correctamente.');
      this.readProgress();
    } catch (error) {
      this.draftError.set(error instanceof Error ? error.message : 'No se pudo eliminar el borrador.');
    } finally { this.deletingDraft.set(false); }
  }

  private readJSON(key: string): unknown {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(window.localStorage.getItem(key) ?? 'null') as unknown; }
    catch { return null; }
  }

  private filled(value: unknown): boolean {
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim().length > 0;
  }

  private readProgress(): void {
    const draft = this.readJSON(DRAFT_KEY) as Partial<RegistroDraft> | null;
    const data = draft ?? {};
    const personal = REQUIRED.map(fields => {
      const complete = fields.filter(key => this.filled(data[key])).length;
      return Math.round(100 * complete / fields.length);
    });
    const processes = this.readJSON('kardex.demo.reclutamiento.v2');
    const laboral = (key: string) => this.readJSON('kardex.demo.laboral.' + key);
    const laboralRequired = [
      this.filled(laboral('adscripciones')),
      this.filled(laboral('regimen')),
      this.filled(laboral('situacion')),
      this.filled(laboral('fechaCargo')),
      laboral('ingresoRegistrado') === true,
      this.filled(laboral('jornadas'))
    ];
    const standards = this.readJSON('kardex.demo.estandares.v2');
    const moduleProgress = (key: ModuloKey): number => {
      const storage = key === 'salud' ? (typeof window !== 'undefined' ? window.sessionStorage : null) : (typeof window !== 'undefined' ? window.localStorage : null);
      let data: { forms?: Record<string,Record<string,string>>; records?: Record<string,unknown[]>; completed?: Record<string,boolean> } = {};
      try { data = JSON.parse(storage?.getItem('kardex.modulos.v1.' + encodeURIComponent(this.session?.userId || 'invitado') + '.' + key) || '{}') || {}; } catch { return 0; }
      const groups = MODULOS[key].groups;
      if (!groups.length) return 0;
      return Math.round(groups.reduce((sum,group) => {
        if ((data.records?.[group.key]?.length || 0) > 0 || data.completed?.[group.key]) return sum + 100;
        const fields = group.fields.filter(field => field.required && (!field.dependsOn || data.forms?.[group.key]?.[field.dependsOn.key] === field.dependsOn.equals));
        if (!fields.length) return sum;
        const filled = fields.filter(field => !!data.forms?.[group.key]?.[field.key]?.trim()).length;
        return sum + Math.min(95, Math.round(100*filled/fields.length));
      }, 0) / groups.length);
    };
    this.percentages.set({
      datos: Math.round(personal.reduce((a, b) => a + b, 0) / personal.length),
      reclutamiento: this.filled(processes) ? 100 : 0,
      'condiciones-laborales': Math.round(100 * laboralRequired.filter(Boolean).length / laboralRequired.length),
      'control-confianza': 0, // Solo se obtiene desde ECCC; no inventar datos.
      'certificacion-individual': this.filled(standards) ? 100 : 0,
      'formacion-academica': moduleProgress('formacion-academica'),
      profesionalizacion: moduleProgress('profesionalizacion'),
      estimulos: moduleProgress('estimulos'),
      separacion: moduleProgress('separacion'),
      'regimen-disciplinario': moduleProgress('regimen-disciplinario'),
      salud: moduleProgress('salud')
    });
  }

  percent(key: RegistrationSection | undefined): number { return key ? this.percentages()[key] ?? 0 : 0; }

  toggleSidebar(): void { this.sidebarOpen.update(open => !open); }

  closeMobileSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) this.sidebarOpen.set(false);
  }

  async logout(): Promise<void> {
    try { if (typeof window !== 'undefined') window.sessionStorage.removeItem('kardex.modulos.v1.' + encodeURIComponent(this.session?.userId || 'invitado') + '.salud'); this.flow.clear(); await this.signOutUseCase.execute(); }
    finally { await this.router.navigate(['/login']); }
  }
}

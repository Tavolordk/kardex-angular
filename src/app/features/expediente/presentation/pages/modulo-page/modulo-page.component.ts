import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GetCurrentSessionUseCase } from '../../../../auth/application/get-current-session.use-case';
import { SignOutUseCase } from '../../../../auth/application/sign-out.use-case';
import { KardexFlowService } from '../../../../../core/navigation/kardex-flow.service';
import { InstitutionalHeaderComponent } from '../../../../../shared/layout/institutional-header/institutional-header.component';
import { SidebarComponent } from '../../../../../shared/layout/sidebar/sidebar.component';
import { SectionHeaderComponent } from '../../../../../shared/ui/section-header/section-header.component';
import { CatalogosService } from '../../../../catalogos/infrastructure/catalogos.service';
import { CatalogoOption, CatalogoEndpoint } from '../../../../catalogos/domain/models/catalogo.model';
import { FieldConfig, GroupConfig, isModuloKey, MODULOS, ModuloConfig, ModuloKey } from '../../../domain/modulos.config';

interface RecordEntry { id: string; values: Record<string, string>; documentNames?: string[]; }
interface LocalModuleState {
  forms: Record<string, Record<string, string>>;
  records: Record<string, RecordEntry[]>;
  completed: Record<string, boolean>;
  // Archivos no se incluyen en el almacenamiento permanente: faltan endpoints de carga.
}
interface FileSelection { id: string; name: string; size: number; type: string; }
const createState = (): LocalModuleState => ({ forms: {}, records: {}, completed: {} });
const STORAGE_PREFIX = 'kardex.modulos.v1.';
const MIN_YEAR = '1900-01-01';

@Component({
  selector: 'app-modulo-page',
  standalone: true,
  imports: [FormsModule, InputCaseDirective, InstitutionalHeaderComponent, SidebarComponent, SectionHeaderComponent],
  templateUrl: './modulo-page.component.html',
  styleUrl: './modulo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuloPageComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogos = inject(CatalogosService);
  private readonly signOutUseCase = inject(SignOutUseCase);
  private readonly flow = inject(KardexFlowService);
  private readonly sessionUseCase = inject(GetCurrentSessionUseCase);
  private readonly routeSubscription: Subscription;
  private readonly volatileFiles = new Map<string, File>();

  readonly session = this.sessionUseCase.execute();
  readonly sidebarOpen = signal(typeof window !== 'undefined' && window.innerWidth > 900);
  readonly modulo = signal<ModuloConfig>(MODULOS['formacion-academica']);
  readonly activeTab = signal('estudios');
  readonly state = signal<LocalModuleState>(createState());
  readonly modalGroup = signal<string | null>(null);
  readonly editId = signal<string | null>(null);
  readonly modalValue = signal<Record<string, string>>({});
  readonly modalDocumentNames = signal<string[]>([]);
  readonly fileSelections = signal<Record<string, FileSelection[]>>({});
  readonly notice = signal('');
  readonly error = signal('');
  readonly invalidFields = signal<string[]>([]);
  readonly showHelp = signal(true);
  readonly recentSave = signal(false);
  readonly catalogOptions = signal<Partial<Record<CatalogoEndpoint, CatalogoOption[]>>>({});
  readonly catalogLoading = signal<CatalogoEndpoint[]>([]);
  catalogValues(field: FieldConfig): CatalogoOption[] { return field.catalogo ? this.catalogOptions()[field.catalogo] ?? [] : []; }
  catalogContains(field: FieldConfig, value: string): boolean {
    return this.catalogValues(field).some(option => option.value === value);
  }
  private async loadCatalogs(key: ModuloKey): Promise<void> {
    const fields = MODULOS[key].groups.flatMap(group => [...group.fields,...(group.sections?.flatMap(section => [...section.fields]) ?? [])]);
    const endpoints = [...new Set(fields.map(field => field.catalogo).filter((endpoint): endpoint is CatalogoEndpoint => !!endpoint))];
    this.catalogLoading.set(endpoints);
    const results = await Promise.allSettled(endpoints.map(endpoint => this.catalogos.obtener(endpoint)));
    if (this.modulo().key !== key) return;
    const options: Partial<Record<CatalogoEndpoint, CatalogoOption[]>> = {};
    endpoints.forEach((endpoint, i) => { const result = results[i]; if(result.status === 'fulfilled' && result.value.length) options[endpoint] = result.value; });
    this.catalogOptions.set(options);
    this.catalogLoading.set([]);
  }
  readonly visibleGroups = computed(() => {
    const key = this.modulo().key;
    const groups = this.modulo().groups;
    // Figma: académico = página continua; formación profesional y salud = pestañas.
    return key === 'formacion-academica' ? groups : groups.filter(group => {
      if (key === 'salud' && (this.activeTab() === 'fisico' || this.activeTab() === 'senas')) return group.key === 'fisico' || group.key === 'senas';
      return group.key === this.activeTab();
    });
  });
  readonly selectedGroup = computed(() => this.modulo().groups.find(g => g.key === this.modalGroup()) ?? null);
  readonly currentGroup = computed(() => this.modulo().groups.find(group => group.key === this.activeTab()) ?? null);
  readonly totalProgress = computed(() => {
    const groups = this.modulo().groups;
    return groups.length ? Math.round(groups.reduce((total, group) => total + this.groupProgress(group), 0) / groups.length) : 0;
  });
  readonly storedInSession = computed(() => this.modulo().key === 'salud');
  readonly hasTabs = computed(() => this.modulo().key === 'profesionalizacion' || this.modulo().key === 'salud' || this.modulo().key === 'regimen-disciplinario');
  readonly documentBuckets = ['documentos-inicial', 'documentos-continua'];

  constructor() {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const key = params.get('modulo') ?? '';
      if (!isModuloKey(key)) { void this.router.navigate(['/menu']); return; }
      this.configure(key);
    });
  }

  ngOnDestroy(): void { this.routeSubscription.unsubscribe(); if (typeof document !== 'undefined') document.body.style.overflow = ''; }

  private configure(key: ModuloKey): void {
    this.modulo.set(MODULOS[key]);
    this.activeTab.set(MODULOS[key].groups[0].key);
    this.modalGroup.set(null);
    this.editId.set(null);
    this.error.set('');
    this.notice.set('');
    this.invalidFields.set([]);
    this.fileSelections.set({});
    this.volatileFiles.clear();
    this.state.set(this.restore(key));
    this.catalogOptions.set({});
    void this.loadCatalogs(key);
  }

  private moduleStorageKey(key: ModuloKey): string {
    return STORAGE_PREFIX + encodeURIComponent(this.session?.userId || 'invitado') + '.' + key;
  }

  private get storage(): Storage | null {
    if (typeof window === 'undefined') return null;
    // La información clínica es sensible: nunca persistirla en localStorage.
    return this.modulo().key === 'salud' ? window.sessionStorage : window.localStorage;
  }

  private restore(key: ModuloKey): LocalModuleState {
    if (typeof window === 'undefined') return createState();
    try {
      const storage = key === 'salud' ? window.sessionStorage : window.localStorage;
      const raw = JSON.parse(storage.getItem(this.moduleStorageKey(key)) || 'null') as Partial<LocalModuleState> | null;
      if (!raw || typeof raw !== 'object') return createState();
      return { forms: raw.forms || {}, records: raw.records || {}, completed: raw.completed || {} };
    } catch { return createState(); }
  }

  private persist(next: LocalModuleState, announce = false): void {
    this.state.set(next);
    try {
      this.storage?.setItem(this.moduleStorageKey(this.modulo().key), JSON.stringify(next));
      if (announce) { this.recentSave.set(true); this.notice.set(this.storedInSession() ? 'Avance guardado en esta sesión del navegador. No se ha enviado al servidor.' : 'Avance guardado localmente en este dispositivo. No se ha enviado al servidor.'); }
    } catch {
      this.error.set('No se pudo guardar en el navegador. Libere espacio o habilite el almacenamiento antes de salir.');
    }
  }

  tabClick(group: GroupConfig): void {
    this.activeTab.set(group.key);
    this.notice.set(''); this.error.set(''); this.invalidFields.set([]);
  }
  groupProgress(group: GroupConfig): number {
    const state = this.state();
    if (group.documents && !group.fields.length) return this.fileCount('documentos-inicial') + this.fileCount('documentos-continua') > 0 ? 50 : 0;
    if (group.repeatable && (state.records[group.key]?.length ?? 0) > 0) return 100;
    const value = state.forms[group.key] || {};
    const required = [...this.requiredFields(group.fields, value), ...(group.key === 'condicion' && value['incapacidades'] === 'si' ? (group.sections?.flatMap(section => section.fields.filter(field => field.required)) || []) : [])];
    if (required.length === 0) return group.repeatable ? 0 : (state.completed[group.key] ? 100 : 0);
    const count = required.filter(field => this.hasValue(value[field.key])).length;
    const pct = Math.round((count / required.length) * 100);
    return group.repeatable ? Math.min(80, pct * .8) : (state.completed[group.key] ? pct : Math.min(95, pct));
  }
  requiredFields(fields: readonly FieldConfig[], values: Record<string, string>): FieldConfig[] {
    return fields.filter(field => field.required && this.fieldVisible(field, values));
  }
  hasValue(value: string | undefined): boolean { return !!value?.toString().trim(); }
  fieldVisible(field: FieldConfig, values: Record<string, string>): boolean { return !field.dependsOn || values[field.dependsOn.key] === field.dependsOn.equals; }
  fieldInvalid(group: string, field: FieldConfig): boolean { return this.invalidFields().includes(group + '.' + field.key); }
  inlineFieldValue(group: string, field: string): string { return this.state().forms[group]?.[field] ?? ''; }
  onInlineField(group: GroupConfig, field: FieldConfig, value: string): void {
    const current = this.state();
    const form = { ...(current.forms[group.key] ?? {}), [field.key]: value };
    if (this.modulo().key === 'salud' && group.key === 'fisico' && (field.key === 'estatura' || field.key === 'peso')) {
      const height = Number(form['estatura']) / 100, weight = Number(form['peso']);
      form['imc'] = height > 0 && weight > 0 ? (weight / (height * height)).toFixed(1) : '';
    }
    this.invalidFields.update(keys => keys.filter(key => key !== group.key + '.' + field.key));
    this.persist({ ...current, forms: { ...current.forms, [group.key]: form }, completed: { ...current.completed, [group.key]: false } });
  }

  private validationErrors(group: GroupConfig, values: Record<string, string>): string[] {
    const allFields = [...group.fields, ...((group.key !== 'condicion' || values['incapacidades'] === 'si') ? (group.sections?.flatMap(section => section.fields) || []) : [])];
    const errors = this.requiredFields(allFields, values).filter(field => !this.hasValue(values[field.key])).map(field => group.key + '.' + field.key);
    for (const field of allFields) {
      if (!this.fieldVisible(field, values) || !this.hasValue(values[field.key])) continue;
      const val = values[field.key];
      if (field.type === 'number') {
        const n = Number(val);
        if (!Number.isFinite(n) || (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)) errors.push(group.key + '.' + field.key);
      }
      if (field.type === 'date' && val < MIN_YEAR) errors.push(group.key + '.' + field.key);
    }
    const pairs = [['inicio','termino'],['ingreso','egreso'],['fechaInicio','nombramiento'],['inicio','fin']];
    for (const [start,end] of pairs) if (values[start] && values[end] && values[end] < values[start]) errors.push(group.key + '.' + end);
    return [...new Set(errors)];
  }

  saveCurrentGroup(group: GroupConfig): void {
    const values = this.state().forms[group.key] || {};
    if (group.repeatable) { this.addRecord(group, values, null); return; }
    const errors = this.validationErrors(group, values);
    this.invalidFields.set(errors);
    if (errors.length) { this.error.set('Complete los campos obligatorios o corrija las fechas antes de finalizar el apartado.'); return; }
    const current = this.state();
    this.persist({ ...current, completed: { ...current.completed, [group.key]: true } }, true);
    this.error.set('');
  }

  openModal(group: GroupConfig, row?: RecordEntry): void {
    this.modalGroup.set(group.key);
    this.editId.set(row?.id ?? null);
    this.modalValue.set({ ...(row?.values || {}) });
    this.modalDocumentNames.set(row?.documentNames || []);
    this.invalidFields.set([]);this.error.set('');this.notice.set('');
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }
  closeModal(): void {
    this.modalGroup.set(null);this.editId.set(null);this.modalValue.set({});this.modalDocumentNames.set([]);this.invalidFields.set([]);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
  onModalField(key: string,value: string): void { this.modalValue.update(prev => ({...prev,[key]:value}));this.invalidFields.set(this.invalidFields().filter(item => item !== this.modalGroup() + '.' + key)); }
  submitModal(): void {
    const group = this.selectedGroup();
    if (!group) return;
    const values = this.modalValue();
    this.addRecord(group,values,this.editId(),this.modalDocumentNames());
  }
  private addRecord(group: GroupConfig,values: Record<string,string>, id: string|null, documentNames: string[] = []): void {
    const errors = this.validationErrors(group,values);
    this.invalidFields.set(errors);
    if (errors.length) { this.error.set('Complete los campos obligatorios y verifique los valores resaltados.'); return; }
    if (group.key === 'idiomas' && !this.hasValue(values['lengua']) && !this.hasValue(values['idioma'])) {
      this.error.set('Indique por lo menos una lengua nacional o un idioma extranjero.');return;
    }
    const current = this.state();
    const existing = current.records[group.key] || [];
    const entry: RecordEntry = { id: id ?? this.newId(), values: { ...values }, documentNames };
    const records = id ? existing.map(record => record.id === id ? entry : record) : [ ...existing, entry ];
    this.persist({ ...current, records: { ...current.records, [group.key]: records }, forms: { ...current.forms, [group.key]: {} }, completed: { ...current.completed, [group.key]: true } }, true);
    this.error.set('');
    if (this.modalGroup()) this.closeModal();
  }
  deleteRecord(group: GroupConfig,record: RecordEntry): void {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar este registro de ' + group.label + '?')) return;
    const current = this.state();
    const records = (current.records[group.key] || []).filter(row => row.id !== record.id);
    this.persist({ ...current, records: { ...current.records, [group.key]: records }, completed: { ...current.completed, [group.key]: records.length > 0 } }, true);
  }
  entries(group: GroupConfig): readonly RecordEntry[] { return this.state().records[group.key] || []; }
  valueLabel(value: string | undefined): string {
    if (!value) return '—';
    if (value === 'si') return 'Sí'; if(value === 'no') return 'No';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const [year,month,day] = value.split('-'); return `${day}/${month}/${year}`; }
    return value;
  }
  nameFor(group: GroupConfig,key: string): string { return group.fields.find(field => field.key === key)?.label || key; }
  showInitialInline(group: GroupConfig): boolean {
    return group.repeatable === true && this.entries(group).length === 0 && ((this.modulo().key === 'formacion-academica' && group.key !== 'idiomas') || this.modulo().key === 'estimulos' || this.modulo().key === 'separacion' || this.modulo().key === 'regimen-disciplinario');
  }
  onEscape(): void { if (this.modalGroup()) this.closeModal(); }
  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeMobileSidebar(): void { if (typeof window !== 'undefined' && window.innerWidth <= 900) this.sidebarOpen.set(false); }
  toggleHelp(): void { this.showHelp.update(v => !v); }
  goToMenu(): void { void this.router.navigate(['/menu']); }
  saveDraft(): void { this.persist(this.state(),true); this.error.set(''); }
  clearLocalCapture(): void {
    if (typeof window !== 'undefined' && !window.confirm('¿Borrar la captura local de este módulo? Esta acción no se puede deshacer.')) return;
    try { this.storage?.removeItem(this.moduleStorageKey(this.modulo().key)); } catch { /* almacenamiento restringido */ }
    this.state.set(createState()); this.fileSelections.set({}); this.volatileFiles.clear();
    this.invalidFields.set([]); this.error.set(''); this.notice.set('Captura local borrada.');
  }
  async logout(): Promise<void> { try { if (typeof window !== 'undefined') window.sessionStorage.removeItem(this.moduleStorageKey('salud')); this.flow.clear(); await this.signOutUseCase.execute(); } finally { void this.router.navigate(['/login']); } }

  fileCount(bucket: string): number { return this.fileSelections()[bucket]?.length || 0; }
  fileList(bucket: string): readonly FileSelection[] { return this.fileSelections()[bucket] || []; }
  async onFileInput(event: Event,bucket: string,modal = false): Promise<void> {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files || []);
    input.value = '';
    for (const file of incoming) {
      if (!['application/pdf','image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        this.error.set('Sólo se permiten PDF o JPG de hasta 5 MB por archivo.');continue;
      }
      const id = this.newId();
      this.volatileFiles.set(id,file);
      if (modal) this.modalDocumentNames.update(names => [...names, file.name]);
      else this.fileSelections.update(current => ({...current,[bucket]:[...(current[bucket] || []),{id,name:file.name,size:file.size,type:file.type}]}));
      this.notice.set('Archivo preparado únicamente durante esta sesión. Para conservarlo es necesario integrar la API de documentos.');
      this.error.set('');
    }
  }
  removeFile(bucket:string,id:string):void { this.volatileFiles.delete(id);this.fileSelections.update(current => ({...current,[bucket]:(current[bucket] || []).filter(f => f.id !== id)})); }
  removeModalFile(index:number):void { this.modalDocumentNames.update(names => names.filter((_,i) => i !== index)); }
  openFile(id:string):void {
    const file=this.volatileFiles.get(id);
    if(!file){ this.error.set('El archivo ya no está disponible. Vuelva a seleccionarlo para visualizarlo.'); return; }
    const url=URL.createObjectURL(file);window.open(url,'_blank','noopener,noreferrer');
    window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  formatFileSize(size:number):string { return (size / (1024 * 1024)).toFixed(1) + ' MB'; }
  nextTab():void { const idx=this.modulo().groups.findIndex(group => group.key===this.activeTab());const next=this.modulo().groups[idx+1]; if (next) this.tabClick(next); else this.goToMenu(); }
  private newId():string { return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
}

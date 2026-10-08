import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputCaseDirective } from '../../../../../shared/directives/input-case.directive';

type Section = 'adscripcion' | 'situacion' | 'armas' | 'percepciones' | 'prestaciones';
interface Adscripcion { placa: string; institucion: string; dependencia: string; entidad: string; municipio: string; jerarquia: string; estatus: string; }
interface Arma { tipo: string; licencia: string; fecha: string; vigencia: string; }
@Component({
 selector: 'app-condiciones-laborales', standalone: true,
 imports: [FormsModule, InputCaseDirective],
 templateUrl: './condiciones-laborales.component.html',
 styleUrl: './condiciones-laborales.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush
})
export class CondicionesLaboralesComponent {
 readonly tabs: {id: Section; label: string}[] = [
  {id:'adscripcion',label:'Adscripción'}, {id:'situacion',label:'Situación y condición laboral'},
  {id:'armas',label:'Portación laboral'}, {id:'percepciones',label:'Percepciones, vacaciones y nómina'},
  {id:'prestaciones',label:'Seguridad social y prestaciones'}
 ];
 readonly active = signal<Section>('adscripcion');
 readonly modal = signal<'adscripcion'|'armas'|null>(null);
 readonly adscripciones = signal<Adscripcion[]>(this.restore<Adscripcion[]>("adscripciones", []));
 readonly armas = signal<Arma[]>(this.restore<Arma[]>("armas", []));
 readonly jornadas = signal<string[]>(this.restore<string[]>("jornadas", []));
 readonly reingresos = signal<string[]>(this.restore<string[]>("reingresos", []));
 readonly feedback = signal('');
 readonly savedAt = signal(this.restore<string>('savedAt', ''));
 readonly editing = signal<number | null>(null);
 private restore<T>(key: string, fallback: T): T {
   try { return JSON.parse(localStorage.getItem('kardex.demo.laboral.' + key) || 'null') ?? fallback; }
   catch { return fallback; }
 }
 private persist(): void {
   try {
     const data: Record<string, unknown> = {adscripciones: this.adscripciones(), armas: this.armas(), jornadas: this.jornadas(), reingresos: this.reingresos(), ingreso: this.ingreso, ingresoRegistrado: this.ingresoRegistrado(), regimen: this.regimen, situacion: this.situacion, fechaCargo: this.fechaCargo, sueldo: this.sueldo, vacaciones: this.vacaciones, numeroNomina: this.numeroNomina, institucionSocial: this.institucionSocial, numeroSeguridadSocial: this.numeroSeguridadSocial, tipoPrestacion: this.tipoPrestacion, savedAt: this.savedAt()};
     for (const [key,value] of Object.entries(data)) localStorage.setItem('kardex.demo.laboral.' + key, JSON.stringify(value));
   } catch { /* Quota or storage unavailable */ }
 }
 editAdscripcion(index: number): void { this.editing.set(index); this.adscripcion = {...this.adscripciones()[index]}; this.modal.set('adscripcion'); }
 editArma(index: number): void { this.editing.set(index); this.arma = {...this.armas()[index]}; this.modal.set('armas'); }
 deleteItem(which: 'adscripcion' | 'armas' | 'jornadas' | 'reingresos', index: number): void {
   if (!confirm('¿Eliminar este registro de demostración?')) return;
   if (which === 'adscripcion') this.adscripciones.update(v => v.filter((_, i) => i !== index));
   if (which === 'armas') this.armas.update(v => v.filter((_, i) => i !== index));
   if (which === 'jornadas') this.jornadas.update(v => v.filter((_, i) => i !== index));
   if (which === 'reingresos') this.reingresos.update(v => v.filter((_, i) => i !== index));
   this.persist(); this.feedback.set('Registro eliminado.');
 }
 validateForAdvance(): boolean {
   if (!this.canAdvance()) {
     this.feedback.set('Para continuar registre una adscripción, régimen, situación, fecha de inicio en el cargo, fecha de ingreso inicial y una jornada con días de descanso.');
     return false;
   }
   this.persist(); this.feedback.set('Datos obligatorios completos.'); return true;
 }
 canAdvance(): boolean { return this.adscripciones().length > 0 && !!this.regimen && !!this.situacion && !!this.fechaCargo && this.ingresoRegistrado() && this.jornadas().length > 0; }

 readonly jornadaAbierta = signal(false);
 readonly diasDescanso = signal<string[]>([]);
 readonly dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 toggleDia(dia: string): void { this.diasDescanso.update(items => items.includes(dia) ? items.filter(d => d !== dia) : [...items, dia]); }
 abrirJornada(): void { this.jornadaAbierta.set(true); this.feedback.set(''); }
 cancelarJornada(): void { this.jornadaAbierta.set(false); }

 adscripcion: Adscripcion = this.emptyAdscripcion();
 arma: Arma = this.emptyArma();
 regimen = ''; situacion = ''; fechaCargo = ''; jornada = ''; entrada = ''; salida = ''; descanso = ''; ingreso = ''; reingreso = '';
 sueldo = ''; vacaciones = ''; numeroNomina = ''; institucionSocial = ''; numeroSeguridadSocial = ''; tipoPrestacion = '';
 constructor() { this.ingreso = this.restore('ingreso', ''); this.ingresoRegistrado.set(this.restore('ingresoRegistrado', false)); for (const key of ['regimen','situacion','fechaCargo','sueldo','vacaciones','numeroNomina','institucionSocial','numeroSeguridadSocial','tipoPrestacion'] as const) this[key] = this.restore(key, ''); }
 changeTab(id: Section): void {this.active.set(id); this.feedback.set('');}
 open(which:'adscripcion'|'armas'):void {this.editing.set(null);this.modal.set(which);this.adscripcion=this.emptyAdscripcion();this.arma=this.emptyArma();}
 close():void {this.modal.set(null);}
 saveAdscripcion():void {
  if (!this.adscripcion.placa.trim() || !this.adscripcion.institucion.trim() || !this.adscripcion.dependencia.trim() || !this.adscripcion.entidad.trim() || !this.adscripcion.municipio.trim() || !this.adscripcion.jerarquia.trim()) {this.feedback.set('Complete placa, institución, dependencia, entidad, municipio y jerarquía.');return;}
  const edit=this.editing();this.adscripciones.update(items=>edit===null ? [{...this.adscripcion},...items] : items.map((x,i)=>i===edit ? {...this.adscripcion} : x));this.persist();this.close();this.feedback.set('Adscripción agregada al historial local.');
 }
 saveArma():void {
  if (!this.arma.tipo.trim() || !this.arma.licencia.trim() || !this.arma.fecha || !this.arma.vigencia || this.arma.vigencia < this.arma.fecha) {this.feedback.set('Complete los datos de la licencia y verifique que la vigencia no sea anterior a la fecha de expedición.');return;}
  const edit=this.editing();this.armas.update(items=>edit===null ? [{...this.arma},...items] : items.map((x,i)=>i===edit ? {...this.arma} : x));this.persist();this.close();this.feedback.set('Registro de portación agregado al historial local.');
 }
 saveJornada():void {if (!this.jornada.trim() || !this.entrada || !this.salida || !this.diasDescanso().length) {this.feedback.set('Indique la jornada, las horas de entrada y salida y los días de descanso.');return;}this.jornadas.update(items=>[`${this.jornada} · ${this.entrada}–${this.salida} · Descanso: ${this.diasDescanso().join(', ') || 'Sin especificar'}`,...items]);this.persist();this.jornadaAbierta.set(false);this.feedback.set('Nueva jornada registrada localmente.');}
 saveReingreso():void {if(!this.ingreso){this.feedback.set('Registre primero la fecha original de ingreso.');return;}if(!this.reingreso)return;if(this.reingreso<=this.ingreso){this.feedback.set('El reingreso debe ser posterior a la fecha de ingreso original.');return;}this.reingresos.update(items=>[this.reingreso,...items]);this.reingreso='';this.persist();this.feedback.set('Reingreso registrado localmente.');}
 saveIngreso():void {if(!this.ingreso){this.feedback.set('Indique la fecha de ingreso original.');return;}this.ingresoRegistrado.set(true);this.persist();this.feedback.set('La fecha de ingreso original quedó bloqueada para edición.');}
 readonly ingresoRegistrado = signal(false);
 saveLocal():void {
  if (this.active() === 'situacion' && (!this.regimen || !this.situacion || !this.fechaCargo)) {
    this.feedback.set('Complete régimen laboral, situación y fecha de inicio en el cargo.'); return;
  }
  if (this.active() === 'percepciones' && (!this.numeroNomina.trim() || this.sueldo === '' || this.vacaciones === '' || Number(this.sueldo) < 0 || Number(this.vacaciones) < 0)) {
    this.feedback.set('Complete nómina, percepción y vacaciones con cantidades válidas.'); return;
  }
  if (this.active() === 'prestaciones' && (!this.institucionSocial.trim() || !this.numeroSeguridadSocial.trim() || !this.tipoPrestacion.trim())) {
    this.feedback.set('Complete institución, número de seguridad social y prestaciones.'); return;
  }
  const now = new Date().toLocaleString('es-MX'); this.savedAt.set(now); this.persist(); this.feedback.set(`Guardado exitoso (simulación local) · ${now}`);
}
 private emptyAdscripcion():Adscripcion {return {placa:'',institucion:'',dependencia:'',entidad:'',municipio:'',jerarquia:'',estatus:'Activa'};}
 private emptyArma():Arma {return {tipo:'',licencia:'',fecha:'',vigencia:''};}
}

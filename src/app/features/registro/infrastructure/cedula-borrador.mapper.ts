import { RegistroDraft, EMPTY_REGISTRO_DRAFT } from '../domain/models/registro.model';

/** Representación mínima, tipada en la raíz, del contrato CedulaRequest de KardexSaveApi. */
export interface CedulaPayload {
  curp?: string | null;
  secciones: Record<string, unknown>;
}

const read = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T ?? fallback; }
  catch { return fallback; }
};
const laboral = <T>(key: string, fallback: T): T => read(`kardex.demo.laboral.${key}`, fallback);
const text = (value: unknown): string => String(value ?? '').trim();
const cat = (value: unknown): { descripcion: string } | undefined => {
  const descripcion = text(value);
  // Los selects actuales guardan la descripción, no el id del catálogo.
  // No se inventan ids numéricos: CatalogoRef admite descripcion sin id.
  return descripcion ? { descripcion } : undefined;
};
const date = (value: unknown): string | undefined => {
  const input = text(value);
  if (!input) return undefined;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)?.slice(1).reverse().join('-');
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : undefined;
};
const numberOrUndefined = (value: unknown): number | undefined => {
  const raw = text(value);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};
const personFields = (form: RegistroDraft): Record<string, unknown> => ({
  identificacionBasica: {
    nombre: form.nombres || undefined,
    primerApellido: form.primerApellido || undefined,
    segundoApellido: form.segundoApellido || undefined,
    fechaNacimiento: date(form.fechaNacimiento),
    sexo: cat(form.sexo),
    identidadGenero: cat(form.identidadGenero),
    entidadNacimiento: cat(form.entidadNacimiento),
    municipioNacimiento: cat(form.municipioNacimiento),
    cuip: form.cuip || undefined,
    estadoCivil: cat(form.estadoCivil),
    numeroNomina: form.numeroNomina || undefined,
    numeroDependientesEconomicos: numberOrUndefined(form.dependientes),
    licenciaConducir: form.licenciaConducir === 'si'
      ? { numero: form.numeroLicencia || undefined,
          archivo: form.documentoLicenciaNombre ? { nombre: form.documentoLicenciaNombre } : undefined }
      : undefined,
    vulnerabilidades: form.gruposVulnerables.map(tipo => ({ tipoVulnerabilidad: cat(tipo) }))
  },
  residencia: {
    entidadFederativa: cat(form.entidadResidencia),
    municipio: cat(form.municipioResidencia),
    calle: form.calle || undefined, numeroExterior: form.numeroExterior || undefined,
    numeroInterior: form.numeroInterior || undefined, colonia: form.colonia || undefined,
    codigoPostal: form.codigoPostal || undefined
  },
  contacto: {
    contactos: form.contactos.map(item => ({ telefonoCelular: item.telefono || undefined, correoElectronico: item.correo || undefined })),
    contactosEmergencia: form.contactosEmergencia.map(item => ({ nombreCompleto: item.nombre || undefined, telefono: item.telefono || undefined, parentesco: cat(item.parentesco) }))
  },
  fotografiaBiometricos: {
    // La API solo define {nombre,ruta}; un data URL local NO es una ruta de archivo subida.
    fotografia: form.photoName ? { nombre: form.photoName, esFotografiaActualizada: true } : undefined,
    cuentaConRegistroBiometrico: form.biometrico === 'si'
  }
});

function recruitment(): Record<string, unknown> | undefined {
  interface Process { folio?: string; convocatoria?: string; perfilIngreso?: string; estrategiaCodigo?: string; estrategiaDetalle?: string; fecha?: string; estatus?: string; resultado?: string; causaNoIngreso?: string; fechaResolucion?: string; }
  const items = read<Process[]>('kardex.demo.reclutamiento.v2', []);
  if (!items.length) return undefined;
  return { procesos: items.map(p => ({
    folioProceso: p.folio || undefined, convocatoria: cat(p.convocatoria), perfilIngreso: cat(p.perfilIngreso),
    estrategiaReclutamiento: cat(p.estrategiaCodigo), especificacionEstrategia: p.estrategiaDetalle || undefined,
    fechaRegistro: date(p.fecha), estatusReclutamiento: cat(p.estatus),
    resultadoSeleccion: cat(p.resultado), causaNoIngreso: cat(p.causaNoIngreso), fechaResolucion: date(p.fechaResolucion)
  })) };
}

function conditions(): Record<string, unknown> | undefined {
  interface Adscripcion { placa: string; institucion: string; dependencia: string; entidad: string; municipio: string; jerarquia: string; estatus: string; }
  interface Arma { tipo: string; licencia: string; fecha: string; vigencia: string; }
  const adscripciones = laboral<Adscripcion[]>('adscripciones', []);
  const armas = laboral<Arma[]>('armas', []);
  const jornadas = laboral<string[]>('jornadas', []);
  const reingresos = laboral<string[]>('reingresos', []);
  const regimen = laboral('regimen', '');
  const situacion = laboral('situacion', '');
  const fechaCargo = laboral('fechaCargo', '');
  const ingreso = laboral('ingreso', '');
  const vacaciones = laboral('vacaciones', '');
  const mecanismo = laboral('mecanismoFinanciamiento', '');
  const seguridad = {
    institucionSocial: laboral('institucionSocial', ''),
    numeroSeguridadSocial: laboral('numeroSeguridadSocial', ''),
    tipoPrestacion: laboral('tipoPrestacion', ''),
    institucionVivienda: laboral('institucionVivienda', ''),
    tipoVivienda: laboral('tipoVivienda', '')
  };
  const hasSecurity = Object.values(seguridad).some(Boolean);
  if (!adscripciones.length && !armas.length && !jornadas.length && !reingresos.length &&
      !regimen && !situacion && !fechaCargo && !ingreso && !vacaciones && !mecanismo && !hasSecurity) return undefined;
  return {
    adscripciones: adscripciones.map(a => ({ numeroPlaca: a.placa, institucionAdscripcion: cat(a.institucion), dependenciaAdscripcion: cat(a.dependencia), entidadAdscripcion: cat(a.entidad), municipioAdscripcion: cat(a.municipio), jerarquia: cat(a.jerarquia), estatusAdscripcion: cat(a.estatus) })),
    situacionCondicionLaboral: {
      condicionesVigentes: { regimenLaboral: cat(regimen), situacionLaboral: cat(situacion), fechaInicioCargoActual: date(fechaCargo) },
      ingresoInstitucion: { fechaIngresoInicial: date(ingreso), reingresos: reingresos.map(value => ({ fechaReingreso: date(value) })) },
      jornadas: jornadas.map(raw => {
        const [turno = '', horas = '', descanso = ''] = raw.split(' · ');
        const [entrada = '', salida = ''] = horas.split(/[–-]/);
        const dias = descanso.replace(/^Descanso:\s*/, '').split(',').map(x => x.trim()).filter(Boolean);
        return { jornadaTurno: cat(turno), horaEntrada: entrada || undefined, horaSalida: salida || undefined, diasDescanso: dias.map(cat).filter(Boolean) };
      })
    },
    licenciasPortacionArma: armas.map(a => ({ numeroLicencia: a.licencia, tipoArma: cat(a.tipo), fechaLicencia: date(a.fecha), fechaVigencia: date(a.vigencia) })),
    percepcionesVacacionesNomina: { percepciones: [{ mecanismoFinanciamiento: cat(mecanismo), diasVacacionesAnuales: numberOrUndefined(vacaciones) }] },
    seguridadSocialPrestaciones: hasSecurity ? seguridad : undefined
  };
}

/** Se envía siempre el conjunto de secciones capturadas para evitar sobrescribir otra sección con un cuerpo parcial. */
export function buildCedula(form: RegistroDraft, previous?: CedulaPayload | null, activeSection?: string): CedulaPayload {
  const secciones: Record<string, unknown> = { ...(previous?.secciones ?? {}), datosPersonales: personFields(form) };
  const reclutamiento = recruitment();
  const laborales = conditions();
  if (reclutamiento || activeSection === 'reclutamientoSeleccion') secciones['reclutamientoSeleccion'] = reclutamiento ?? { procesos: [] };
  if (laborales || activeSection === 'condicionesLaborales') secciones['condicionesLaborales'] = laborales ?? { adscripciones: [], licenciasPortacionArma: [], situacionCondicionLaboral: {} };
  return { curp: form.curp || previous?.curp || undefined, secciones };
}

/** Traduce los valores del backend que tienen equivalente en el formulario actual. */
export function restorePerson(cedula: CedulaPayload): Partial<RegistroDraft> {
  const sec = (cedula.secciones?.['datosPersonales'] ?? {}) as Record<string, Record<string, any> | undefined>;
  const id = sec['identificacionBasica'] ?? {};
  const res = sec['residencia'] ?? {};
  const con = sec['contacto'] ?? {};
  const foto = sec['fotografiaBiometricos'] ?? {};
  const get = (v: unknown): string => typeof v === 'string' ? v : '';
  const description = (v: unknown): string => get((v as {descripcion?:unknown} | null)?.descripcion);
  const fromDate = (v: unknown): string => get(v).slice(0, 10);
  const contacts = Array.isArray(con['contactos']) ? con['contactos'] : [];
  const emergencies = Array.isArray(con['contactosEmergencia']) ? con['contactosEmergencia'] : [];
  const out: Partial<RegistroDraft> = {
    curp: get(cedula.curp), cuip: get(id['cuip']), numeroNomina: get(id['numeroNomina']),
    nombres: get(id['nombre']), primerApellido: get(id['primerApellido']), segundoApellido: get(id['segundoApellido']),
    fechaNacimiento: fromDate(id['fechaNacimiento']), sexo: description(id['sexo']), identidadGenero: description(id['identidadGenero']),
    entidadNacimiento: description(id['entidadNacimiento']), municipioNacimiento: description(id['municipioNacimiento']),
    estadoCivil: description(id['estadoCivil']), dependientes: id['numeroDependientesEconomicos'] === undefined ? '' : String(id['numeroDependientesEconomicos']),
    numeroLicencia: get(id['licenciaConducir']?.numero),
    entidadResidencia: description(res['entidadFederativa']), municipioResidencia: description(res['municipio']),
    calle: get(res['calle']), numeroExterior: get(res['numeroExterior']), numeroInterior: get(res['numeroInterior']),
    colonia: get(res['colonia']), codigoPostal: get(res['codigoPostal']),
    contactos: contacts.map((x: Record<string, unknown>, index: number) => ({ id: `remote-contact-${index}`, telefono: get(x['telefonoCelular']), correo: get(x['correoElectronico']) })),
    contactosEmergencia: emergencies.map((x: Record<string, unknown>, index: number) => ({ id: `remote-emergency-${index}`, nombre: get(x['nombreCompleto']), telefono: get(x['telefono']), parentesco: description(x['parentesco']) })),
    biometrico: foto['cuentaConRegistroBiometrico'] === false ? 'no' : 'si',
    photoName: get(foto['fotografia']?.nombre)
  };
  // No se sobrescriben valores locales que el contrato remoto no admite (data URLs, nacionalidad, etc.).
  return Object.fromEntries(Object.entries(out).filter(([, value]) => value !== '' && (!Array.isArray(value) || value.length > 0))) as Partial<RegistroDraft>;
}

/** Al recuperar un borrador, restablece también los paneles independientes del formulario principal. */
export function restoreOtherSections(cedula: CedulaPayload): void {
  if (typeof localStorage === 'undefined') return;
  const sec = cedula.secciones ?? {};
  const rec = sec['reclutamientoSeleccion'] as { procesos?: any[] } | undefined;
  if (Array.isArray(rec?.procesos)) {
    const get = (v: unknown): string => typeof v === 'string' ? v : '';
    const d = (v: unknown): string => get(v).slice(0, 10);
    const desc = (v: any): string => get(v?.descripcion);
    localStorage.setItem('kardex.demo.reclutamiento.v2', JSON.stringify(rec.procesos.map(p => ({
      folio: get(p.folioProceso), convocatoria: desc(p.convocatoria), perfilIngreso: desc(p.perfilIngreso),
      estrategia: desc(p.estrategiaReclutamiento), estrategiaCodigo: desc(p.estrategiaReclutamiento),
      estrategiaDetalle: get(p.especificacionEstrategia), fecha: d(p.fechaRegistro).split('-').reverse().join('/'),
      fechaResolucion: d(p.fechaResolucion), estatus: desc(p.estatusReclutamiento), resultado: desc(p.resultadoSeleccion), causaNoIngreso: desc(p.causaNoIngreso)
    }))));
  }
  const laboralSec = sec['condicionesLaborales'] as Record<string, any> | undefined;
  if (!laboralSec) return;
  const desc = (v: any): string => typeof v?.descripcion === 'string' ? v.descripcion : '';
  const val = (v: unknown): string => typeof v === 'string' ? v : '';
  const d = (v: unknown): string => val(v).slice(0, 10);
  const put = (key: string, value: unknown): void => localStorage.setItem(`kardex.demo.laboral.${key}`, JSON.stringify(value));
  if (Array.isArray(laboralSec['adscripciones'])) put('adscripciones', laboralSec['adscripciones'].map((a: any) => ({ placa: val(a.numeroPlaca), institucion: desc(a.institucionAdscripcion), dependencia: desc(a.dependenciaAdscripcion), entidad: desc(a.entidadAdscripcion), municipio: desc(a.municipioAdscripcion), jerarquia: desc(a.jerarquia), estatus: desc(a.estatusAdscripcion) })));
  if (Array.isArray(laboralSec['licenciasPortacionArma'])) put('armas', laboralSec['licenciasPortacionArma'].map((a: any) => ({ tipo: desc(a.tipoArma), licencia: val(a.numeroLicencia), fecha: d(a.fechaLicencia), vigencia: d(a.fechaVigencia) })));
  const situacion = laboralSec['situacionCondicionLaboral'] ?? {};
  const vigentes = situacion['condicionesVigentes'] ?? {};
  if (vigentes['regimenLaboral']) put('regimen', desc(vigentes.regimenLaboral));
  if (vigentes['situacionLaboral']) put('situacion', desc(vigentes.situacionLaboral));
  if (vigentes['fechaInicioCargoActual']) put('fechaCargo', d(vigentes.fechaInicioCargoActual));
  const ingreso = situacion['ingresoInstitucion'] ?? {};
  if (ingreso['fechaIngresoInicial']) { put('ingreso', d(ingreso.fechaIngresoInicial)); put('ingresoRegistrado', true); }
  if (Array.isArray(ingreso['reingresos'])) put('reingresos', ingreso['reingresos'].map((r: any) => d(r.fechaReingreso)));
  if (Array.isArray(situacion['jornadas'])) put('jornadas', situacion['jornadas'].map((j: any) => `${desc(j.jornadaTurno)} · ${val(j.horaEntrada)}–${val(j.horaSalida)} · Descanso: ${(j.diasDescanso ?? []).map(desc).join(', ')}`));
  const percepciones = laboralSec['percepcionesVacacionesNomina']?.percepciones?.[0];
  if (percepciones) { if (percepciones.diasVacacionesAnuales != null) put('vacaciones', String(percepciones.diasVacacionesAnuales)); if (percepciones.mecanismoFinanciamiento) put('mecanismoFinanciamiento', desc(percepciones.mecanismoFinanciamiento)); }
  const seguridad = laboralSec['seguridadSocialPrestaciones'];
  if (seguridad && typeof seguridad === 'object') for (const key of ['institucionSocial', 'numeroSeguridadSocial', 'tipoPrestacion', 'institucionVivienda', 'tipoVivienda']) if (typeof seguridad[key] === 'string') put(key, seguridad[key]);
}

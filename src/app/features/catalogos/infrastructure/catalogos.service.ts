import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogoApiResponse, CatalogoEndpoint, CatalogoOption, CatalogoRnpspId, EstadoCartografico } from '../domain/models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly baseUrl = '/api/catalogos/Catalogos';
  private readonly baseCarto = '/api/catalogos/CatalogosCarto';
  private readonly baseRnpsp = '/api/catalogos/CatalogosRnpsp/get-catalogo';

  constructor(private readonly http: HttpClient) {}

  async obtener(endpoint: CatalogoEndpoint): Promise<CatalogoOption[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.baseUrl}/${endpoint}`));
    return this.normalize(response);
  }

  /** Catálogos cartográficos del nuevo contrato OpenAPI. No se asumen estructuras de respuesta. */
  private async carto(path: string, filters: Readonly<Record<string, number>> = {}): Promise<CatalogoOption[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (!Number.isInteger(value) || value < 0) throw new Error(`Parámetro cartográfico inválido: ${key}`);
      params = params.set(key, String(value));
    }
    return this.normalize(await firstValueFrom(this.http.get<unknown>(`${this.baseCarto}/${path}`, { params })));
  }

  /** Formato verificado contra GET /api/catalogos/CatalogosCarto/estados. */
  async estadosCarto(): Promise<CatalogoOption[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.baseCarto}/estados`));
    const catalogo = this.validarRespuestaEstados(response);

    // Los borradores guardan descripciones. El ID se conserva separado para
    // consultar municipios mediante idEstado, sin asumir equivalencias con RNPSP.
    return catalogo.data.map(({ id, descripcion }) => ({
      id,
      label: descripcion.trim(),
      value: descripcion.trim(),
      raw: { id, descripcion }
    }));
  }

  private validarRespuestaEstados(response: unknown): CatalogoApiResponse<EstadoCartografico[]> {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      throw new Error('Respuesta inválida del catálogo de estados.');
    }
    const result = response as Record<string, unknown>;
    if (result['success'] !== true) {
      const message = typeof result['message'] === 'string' ? result['message'] : 'Consulta de estados fallida.';
      throw new Error(message);
    }
    if (!Array.isArray(result['data'])) {
      throw new Error('El catálogo de estados no contiene una lista en data.');
    }
    for (const entry of result['data']) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
          !Number.isInteger(entry.id) || entry.id <= 0 ||
          typeof entry.descripcion !== 'string' || !entry.descripcion.trim()) {
        throw new Error('El catálogo de estados contiene un elemento inválido.');
      }
    }
    return result as unknown as CatalogoApiResponse<EstadoCartografico[]>;
  }
  codigoPostalCarto(codigoPostal: number): Promise<CatalogoOption[]> { return this.carto('cp', { codigoPostal }); }
  municipiosCarto(idEstado: number): Promise<CatalogoOption[]> { return this.carto('municipios', { idEstado }); }
  localidadesCarto(idEstado: number, idMunicipio: number): Promise<CatalogoOption[]> {
    return this.carto('localidades', { idEstado, idMunicipio });
  }
  coloniasCarto(idEstado: number, idMunicipio: number, idLocalidad: number): Promise<CatalogoOption[]> {
    return this.carto('colonias', { idEstado, idMunicipio, idLocalidad });
  }
  callesCarto(idEstado: number, idMunicipio: number, idLocalidad: number, idColonia: number): Promise<CatalogoOption[]> {
    return this.carto('calles', { idEstado, idMunicipio, idLocalidad, idColonia });
  }
  entreCallesCarto(idCalle: number): Promise<CatalogoOption[]> { return this.carto('entre-calles', { idCalle }); }
  callesLateralesCarto(idCalle: number): Promise<CatalogoOption[]> { return this.carto('calles-laterales', { idCalle }); }

  /** Conserva los catálogos RNPSP cuando un catálogo nuevo no esté disponible. */
  async preferirNuevo(nuevo: CatalogoEndpoint, respaldo: CatalogoRnpspId): Promise<CatalogoOption[]> {
    try { const data = await this.obtener(nuevo); if (data.length) return data; }
    catch { /* El backend anterior continúa vigente como respaldo. */ }
    return this.obtenerRnpsp(respaldo);
  }

  /** idEntidad es requerido únicamente para el catálogo RNPSP 6 (municipios). */
  async obtenerRnpsp(id: CatalogoRnpspId, idEntidad?: number): Promise<CatalogoOption[]> {
    if (id === 6 && (!Number.isInteger(idEntidad) || (idEntidad ?? 0) <= 0)) {
      throw new Error('Debe seleccionar una entidad con identificador RNPSP válido.');
    }
    const params = id === 6 ? new HttpParams().set('idEntidad', String(idEntidad)) : undefined;
    const response = await firstValueFrom(this.http.get<unknown>(`${this.baseRnpsp}/${id}`, { params }));
    return this.normalize(response);
  }

  nacionalidadesRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(1); }
  tiposSangreRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(2); }
  factoresSangreRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(3); }
  entidadesRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(5); }
  municipiosRnpsp(idEntidad: number): Promise<CatalogoOption[]> { return this.obtenerRnpsp(6, idEntidad); }
  delitosRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(8); }
  tiposArmaRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(9); }
  jerarquiasRnpsp(): Promise<CatalogoOption[]> { return this.obtenerRnpsp(10); }

  sexo(): Promise<CatalogoOption[]> { return this.obtener('sexo'); }
  identidadGenero(): Promise<CatalogoOption[]> { return this.obtener('identidad-genero'); }
  nacionalidad(): Promise<CatalogoOption[]> { return this.obtener('nacionalidad'); }
  pais(): Promise<CatalogoOption[]> { return this.obtener('pais'); }
  estadoCivil(): Promise<CatalogoOption[]> { return this.obtener('estado-civil'); }
  tipoVulnerabilidad(): Promise<CatalogoOption[]> { return this.obtener('tipo-vulnerabilidad'); }
  estrategiaReclutamiento(): Promise<CatalogoOption[]> { return this.obtener('estrategia-reclutamiento'); }
  estatusReclutamiento(): Promise<CatalogoOption[]> { return this.obtener('estatus-reclutamiento'); }
  resultadoSeleccion(): Promise<CatalogoOption[]> { return this.obtener('resultado-seleccion'); }
  causaNoIngreso(): Promise<CatalogoOption[]> { return this.obtener('causa-no-ingreso'); }
  tipoSangre(): Promise<CatalogoOption[]> { return this.obtener('tipo-sangre'); }
  motivoIncapacidad(): Promise<CatalogoOption[]> { return this.obtener('motivo-incapacidad'); }
  modalidadEstudios(): Promise<CatalogoOption[]> { return this.obtener('modalidad-estudios'); }
  estatusEstudio(): Promise<CatalogoOption[]> { return this.obtener('estatus-estudio'); }
  situacionLaboral(): Promise<CatalogoOption[]> { return this.obtener('situacion-laboral'); }
  institucionSeguroSocial(): Promise<CatalogoOption[]> { return this.obtener('institucion-seguro-social'); }
  institucionSeguroSocialVivienda(): Promise<CatalogoOption[]> { return this.obtener('institucion-seguro-social-vivienda'); }
  mecanismoFinanciamiento(): Promise<CatalogoOption[]> { return this.obtener('mecanismo-financiamiento'); }
  tipoVivienda(): Promise<CatalogoOption[]> { return this.obtener('tipo-vivienda'); }
  naturalezaProcedimiento(): Promise<CatalogoOption[]> { return this.obtener('naturaleza-procedi'); }
  estatusDevolucion(): Promise<CatalogoOption[]> { return this.obtener('estatus-devolucion'); }

  /** Mantiene la etiqueta como value por compatibilidad con los borradores locales existentes. */
  private normalize(response: unknown): CatalogoOption[] {
    return this.extractRows(response)
      .map((item, index) => this.toOption(item, index))
      .filter((item): item is CatalogoOption => item !== null);
  }

  private extractRows(response: unknown, level = 0): unknown[] {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object' || level >= 4) return [];
    const record = response as Record<string, unknown>;
    const keys = ['data', 'result', 'resultado', 'items', 'catalogo', 'catalogos',
      'registros', 'lista', 'listado', 'rows', 'values', 'contenido', 'response', 'respuesta'];
    for (const key of keys) {
      const found = Object.entries(record).find(([name]) => name.toLowerCase() === key);
      if (!found) continue;
      const result = this.extractRows(found[1], level + 1);
      if (Array.isArray(found[1]) || result.length) return result;
    }
    // Algunos servicios RNPSP agrupan la lista bajo una clave con nombre propio.
    const arrays = Object.values(record).filter(Array.isArray);
    return arrays.length === 1 ? arrays[0] : [];
  }

  private toOption(item: unknown, index: number): CatalogoOption | null {
    if (typeof item === 'string' || typeof item === 'number') {
      const text = String(item).trim();
      return text ? { value: text, label: text, raw: item } : null;
    }
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const label = this.firstString(record, [
      'descripcion', 'descripción', 'desc', 'description', 'nombre', 'name', 'label',
      'denominacion', 'denominación', 'valor', 'value', 'texto', 'detalle',
      'sexo', 'identidadGenero', 'nacionalidad', 'pais', 'estadoCivil', 'tipoVulnerabilidad',
      'tipoSangre', 'factorSangre', 'entidad', 'estado', 'municipio', 'localidad', 'colonia', 'calle', 'tipoArma', 'jerarquia'
    ]) ?? this.firstReadableString(record);
    if (!label) return null;
    const id = this.firstScalar(record, [
      'idEntidad', 'idEstado', 'idMunicipio', 'idLocalidad', 'idColonia', 'idCalle', 'id', 'idRegistro', 'idElemento', 'idCatalogo',
      'clave', 'cveEntidad', 'claveEntidad', 'codigo', 'code', 'key',
      'idSexo', 'idIdentidadGenero', 'idNacionalidad', 'idPais', 'idEstadoCivil',
      'idTipoVulnerabilidad', 'fk', 'pk'
    ]);
    return { value: label, label, id: id ?? undefined, raw: { ...record, __catalogId: id ?? index } };
  }

  private readKey(record: Record<string, unknown>, key: string): unknown {
    const normalizeKey = (name: string): string => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const found = Object.keys(record).find(name => normalizeKey(name) === normalizeKey(key));
    return found === undefined ? undefined : record[found];
  }

  private firstString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = this.readKey(record, key);
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private firstScalar(record: Record<string, unknown>, keys: string[]): string | number | null {
    for (const key of keys) {
      const value = this.readKey(record, key);
      if ((typeof value === 'string' && value.trim()) || typeof value === 'number') return value;
    }
    return null;
  }

  private firstReadableString(record: Record<string, unknown>): string | null {
    return Object.entries(record)
      .filter(([key]) => !/^(id|codigo|clave|key|pk|fk|estatus|activo|status)/i.test(key))
      .map(([, value]) => value)
      .find((value): value is string => typeof value === 'string' && !!value.trim())?.trim() ?? null;
  }
}

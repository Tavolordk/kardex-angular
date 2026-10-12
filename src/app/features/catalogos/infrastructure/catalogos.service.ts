import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogoEndpoint, CatalogoOption, CatalogoRnpspId } from '../domain/models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly baseUrl = '/api/catalogos/Catalogos';
  private readonly baseRnpsp = '/api/catalogos/CatalogosRnpsp/get-catalogo';

  constructor(private readonly http: HttpClient) {}

  async obtener(endpoint: CatalogoEndpoint): Promise<CatalogoOption[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.baseUrl}/${endpoint}`));
    return this.normalize(response);
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
      'tipoSangre', 'factorSangre', 'entidad', 'municipio', 'tipoArma', 'jerarquia'
    ]) ?? this.firstReadableString(record);
    if (!label) return null;
    const id = this.firstScalar(record, [
      'idEntidad', 'idMunicipio', 'id', 'idRegistro', 'idElemento', 'idCatalogo',
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

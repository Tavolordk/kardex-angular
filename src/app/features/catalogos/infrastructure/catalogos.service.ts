import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogoEndpoint, CatalogoOption } from '../domain/models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly baseUrl = '/api/catalogos/Catalogos';

  constructor(private readonly http: HttpClient) {}

  async obtener(endpoint: CatalogoEndpoint): Promise<CatalogoOption[]> {
    const response = await firstValueFrom(this.http.get<unknown>(`${this.baseUrl}/${endpoint}`));
    return this.normalize(response);
  }

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

  private normalize(response: unknown): CatalogoOption[] {
    const rows = this.extractRows(response);
    return rows
      .map((item, index) => this.toOption(item, index))
      .filter((item): item is CatalogoOption => item !== null);
  }

  private extractRows(response: unknown): unknown[] {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];

    const record = response as Record<string, unknown>;
    for (const key of ['data', 'result', 'resultado', 'items', 'catalogo', 'catalogos']) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    return [];
  }

  private toOption(item: unknown, index: number): CatalogoOption | null {
    if (typeof item === 'string' || typeof item === 'number') {
      const text = String(item);
      return { value: text, label: text, raw: item };
    }
    if (!item || typeof item !== 'object') return null;

    const record = item as Record<string, unknown>;
    const label = this.firstString(record, [
      'descripcion', 'description', 'nombre', 'name', 'label', 'valor', 'value',
      'sexo', 'identidadGenero', 'nacionalidad', 'pais', 'estadoCivil',
      'tipoVulnerabilidad', 'texto', 'detalle'
    ]) ?? this.firstReadableString(record);

    if (!label) return null;

    const id = this.firstScalar(record, [
      'id', 'clave', 'key', 'codigo', 'code',
      'idSexo', 'idIdentidadGenero', 'idNacionalidad', 'idPais', 'idEstadoCivil',
      'idTipoVulnerabilidad', 'fk', 'pk'
    ]);

    return {
      // El formulario actual persiste texto. Hasta que Swagger publique el DTO de
      // catálogos, conservamos la etiqueta como valor para no romper el borrador.
      value: label,
      label,
      raw: { ...record, __catalogId: id ?? index }
    };
  }

  private firstString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private firstScalar(record: Record<string, unknown>, keys: string[]): string | number | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' || typeof value === 'number') return value;
    }
    return null;
  }

  private firstReadableString(record: Record<string, unknown>): string | null {
    for (const value of Object.values(record)) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }
}

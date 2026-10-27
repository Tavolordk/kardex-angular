/** Respuesta de catálogos confirmada mediante el endpoint CatalogosCarto/estados. */
export interface CatalogoApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

export interface EstadoCartografico {
  id: number;
  descripcion: string;
}

export interface CatalogoOption {
  value: string;
  label: string;
  raw: unknown;
  /** Identificador real devuelto por el backend; no altera el valor persistido. */
  id?: string | number;
}

export type CatalogoRnpspId = 1 | 2 | 3 | 5 | 6 | 8 | 9 | 10;

/** Devuelve el identificador requerido para filtrar municipios por entidad. */
export function entidadRnpspId(options: CatalogoOption[], selected: string): number | null {
  const raw = options.find(option => option.value === selected)?.id;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type CatalogoEndpoint =
  | 'sexo'
  | 'identidad-genero'
  | 'nacionalidad'
  | 'pais'
  | 'estado-civil'
  | 'tipo-vulnerabilidad'
  | 'estrategia-reclutamiento'
  | 'estatus-reclutamiento'
  | 'resultado-seleccion'
  | 'causa-no-ingreso'
  | 'tipo-sangre'
  | 'motivo-incapacidad'
  | 'modalidad-estudios'
  | 'estatus-estudio'
  | 'situacion-laboral'
  | 'institucion-seguro-social'
  | 'institucion-seguro-social-vivienda'
  | 'mecanismo-financiamiento'
  | 'tipo-vivienda'
  | 'naturaleza-procedi'
  | 'estatus-devolucion';

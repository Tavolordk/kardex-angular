export interface CatalogoOption {
  value: string;
  label: string;
  raw: unknown;
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

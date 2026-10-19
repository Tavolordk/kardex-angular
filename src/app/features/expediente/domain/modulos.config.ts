/** Pantallas: Figma formación 321:1578, profesionalización 755:526, estímulos 771:1400,
 * separación 771:2771, salud 765:5893. Las opciones de catálogos no suministradas
 * por la API se capturan como texto libre; nunca se inventan IDs de catálogo. */
export type ModuloKey = 'formacion-academica' | 'profesionalizacion' | 'estimulos' | 'separacion' | 'salud';
export type FieldType = 'text' | 'number' | 'date' | 'yesno' | 'textarea' | 'email';
export interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  step?: string;
  min?: number;
  max?: number;
  dependsOn?: { key: string; equals: string };
}
export interface GroupConfig {
  key: string;
  label: string;
  description: string;
  fields: readonly FieldConfig[];
  /** En tablas con entradas repetibles, usa el modal de captura y el historial. */
  repeatable?: boolean;
  button?: string;
  columns?: readonly string[];
  documents?: boolean;
  sections?: readonly { title: string; fields: readonly FieldConfig[] }[];
}
export interface ModuloConfig {
  key: ModuloKey;
  title: string;
  subtitle: string;
  recommendation: string;
  groups: readonly GroupConfig[];
}
const f = (key: string, label: string, type: FieldType = 'text', required = false, extra: Partial<FieldConfig> = {}): FieldConfig => ({ key, label, type, required, ...extra });
const yes = (key: string, label: string, required = false, extra: Partial<FieldConfig> = {}) => f(key, label, 'yesno', required, extra);
const date = (key: string, label: string, required = false, extra: Partial<FieldConfig> = {}) => f(key, label, 'date', required, extra);
const academic: readonly FieldConfig[] = [
  f('programa','Programa o carrera concluida o registrada','text',true),
  f('nivel','Nivel académico de estudios','text',true),
  f('pais','País de estudios','text',true),
  f('modalidad','Modalidad de estudios','text',true),
  f('estatus','Estatus de estudios','text',true),
  date('inicio','Fecha de inicio de estudios',true),
  date('termino','Fecha de término de estudios'),
  f('institucion','Institución de formación académica','text',true)
];
const promotion = [
  yes('participacion','Ha participado en procesos de promoción',true),
  f('tipo','Tipo de promoción','text',true,{dependsOn:{key:'participacion',equals:'si'}}),
  f('grado','Grado o jerarquía obtenida','text',true,{dependsOn:{key:'participacion',equals:'si'}}),
  date('fechaInicio','Fecha de inicio de proceso de promoción',true,{dependsOn:{key:'participacion',equals:'si'}}),
  date('nombramiento','Fecha del nombramiento',true,{dependsOn:{key:'participacion',equals:'si'}})
];
export const MODULOS: Readonly<Record<ModuloKey, ModuloConfig>> = {
  'formacion-academica': {
    key:'formacion-academica', title:'Formación académica',
    subtitle:'Gestión de la trayectoria académica, títulos, cédulas profesionales e idiomas del personal.',
    recommendation:'Registre la formación académica conforme a sus comprobantes e indique si los estudios están concluidos o en curso.',
    groups:[
      {key:'estudios',label:'Formación académica',description:'Programa o carrera concluida o registrada.',repeatable:true,button:'Agregar estudios',columns:['programa','nivel','estatus','institucion'],fields:academic},
      {key:'cedulas',label:'Cédula profesional y comprobantes',description:'Capture la cédula y adjunte el documento que acredita los estudios.',repeatable:true,button:'Agregar cédula',columns:['cedula','nivel','institucion','otorgamiento'],documents:true,fields:[f('cedula','Cédula profesional','text',true),f('nivel','Nivel académico de estudios','text',true),f('institucion','Institución','text',true),date('otorgamiento','Fecha de otorgamiento',true)]},
      {key:'encurso',label:'Estudios en curso',description:'Indique si actualmente cursa estudios y cuál es el programa.',fields:[yes('cursa','Actualmente se encuentra cursando estudios',true),f('programaCurso','Programa o carrera que se encuentra cursando','text',true,{dependsOn:{key:'cursa',equals:'si'}})]},
      {key:'idiomas',label:'Competencias adicionales',description:'Lenguas nacionales e idiomas extranjeros que domina.',repeatable:true,button:'Agregar idioma o lengua',columns:['lengua','idioma'],fields:[f('lengua','Lengua nacional'),f('idioma','Idioma extranjero')]}
    ]
  },
  profesionalizacion:{
    key:'profesionalizacion',title:'Servicio profesional de carrera (Profesionalización)',subtitle:'Formación inicial, continua y sus comprobantes.',
    recommendation:'Consulte el historial de capacitaciones y la trayectoria de ascensos y grados jerárquicos del personal.',
    groups:[
      {key:'inicial',label:'Formación inicial',description:'Historial y registro de formación inicial.',repeatable:true,button:'Nueva formación inicial',columns:['tipo','instancia','ingreso','egreso'],fields:[yes('formacion','Formación inicial',true),f('tipo','Tipo de formación inicial','text',true,{dependsOn:{key:'formacion',equals:'si'}}),f('horas','Horas de formación inicial','number',true,{min:0,dependsOn:{key:'formacion',equals:'si'}}),f('instancia','Academia o instancia de profesionalización','text',true,{dependsOn:{key:'formacion',equals:'si'}}),date('ingreso','Fecha de ingreso de formación inicial',true,{dependsOn:{key:'formacion',equals:'si'}}),date('egreso','Fecha de egreso de formación inicial',true,{dependsOn:{key:'formacion',equals:'si'}})]},
      {key:'continua',label:'Formación continua',description:'Historial y registro de formación continua.',repeatable:true,button:'Nuevo registro',columns:['tipo','instancia','ingreso','egreso'],fields:[yes('formacion','Formación continua',true),f('tipo','Tipo de formación continua','text',true,{dependsOn:{key:'formacion',equals:'si'}}),f('horas','Horas de formación continua','number',true,{min:0,dependsOn:{key:'formacion',equals:'si'}}),f('instancia','Academia o instancia de profesionalización','text',true,{dependsOn:{key:'formacion',equals:'si'}}),date('ingreso','Fecha de ingreso de formación continua',true,{dependsOn:{key:'formacion',equals:'si'}}),date('egreso','Fecha de egreso de formación continua',true,{dependsOn:{key:'formacion',equals:'si'}})]},
      {key:'documentos',label:'Documentos',description:'Comprobantes de formación inicial y continua.',fields:[],documents:true,sections:[{title:'Documentos de formación inicial',fields:[]},{title:'Documentos de formación continua',fields:[]}]},
      {key:'promocion',label:'Promoción',description:'Registro de ascensos, promociones y grados jerárquicos del personal.',repeatable:true,button:'Agregar promoción',columns:['tipo','fechaInicio','nombramiento','grado'],fields:promotion}
    ]
  },
  estimulos:{
    key:'estimulos',title:'Servicio Profesional de Carrera (Estímulos/reconocimientos)',
    subtitle:'Registro de bonificaciones, distinciones otorgadas.',
    recommendation:'Capture las distinciones institucionales, condecoraciones y bonos especiales recibidos. Cada reconocimiento debe estar respaldado por un documento u oficio oficial.',
    groups:[{key:'reconocimientos',label:'Estímulos/reconocimientos',description:'Historial de reconocimientos, condecoraciones, bonos e incentivos económicos.',repeatable:true,button:'Agregar otro',documents:true,columns:['categoria','tipo','autoridad','fecha'],fields:[f('categoria','Categoría de reconocimiento','text',true),f('tipo','Tipo de reconocimiento','text',true),f('autoridad','Autoridad o área otorgante','text',true),date('fecha','Fecha de otorgamiento',true),yes('otrosBonos','Otros bonos económicos',true),yes('quinquenio','Bono de quinquenio',true)]}]
  },
  separacion:{
    key:'separacion',title:'Servicio Profesional de Carrera (Separación del cargo)',
    subtitle:'Registro de la conclusión de la relación administrativa.',
    recommendation:'Valide que la devolución de armamento y placa esté confirmada antes de asentar la fecha final de separación y la restricción de reingreso.',
    groups:[{key:'bajas',label:'Separación del cargo',description:'Fechas de separación, devolución de bienes, armamento y restricciones para el reingreso.',repeatable:true,button:'Agregar separación',columns:['motivo','fechaSeparacion','estatus','armamento'],fields:[
      f('estatus','Estatus en el Servicio Profesional de Carrera','text',true),
      date('fechaBaja','Fecha de baja del Registro Nacional',true),
      yes('pension','Cuenta con pensión por invalidez',true),
      date('fechaSeparacion','Fecha de separación del servicio',true),
      f('motivo','Motivo de separación','text',true),
      f('grado','Último grado o jerarquía','text',true),
      f('armamento','Estatus de devolución de armamento y equipo','text',true),
      date('fechaArmamento','Fecha de entrega de armamento y equipo'),
      date('fechaPlaca','Fecha de entrega de identificación y placa'),
      f('tipoRestriccion','Tipo de restricción para el reingreso'),
      yes('restriccion','Restricción para el reingreso del personal')
    ]}]
  },
  salud:{
    key:'salud',title:'Salud y bienestar',subtitle:'Datos físicos, incapacidades y perfil psicosocial.',
    recommendation:'Capture los datos clínicos únicamente con información autorizada; los registros son información sensible y deben protegerse.',
    groups:[
      {key:'fisico',label:'Perfil físico',description:'Métricas corporales y señas particulares.',fields:[f('estatura','Estatura (cm)','number',true,{min:30,max:260}),f('peso','Peso (kg)','number',true,{min:1,max:500}),f('imc','IMC','number',false,{hint:'Calculado automáticamente con estatura y peso.'}),f('sangre','Tipo de sangre','text',true)]},
      {key:'senas',label:'Señas particulares',description:'Cicatrices, tatuajes, lunares y otras señas.',repeatable:true,button:'Agregar seña',columns:['tipo','ubicacion','descripcion','fecha'],fields:[f('tipo','Tipo de seña','text',true),f('ubicacion','Ubicación corporal','text',true),f('descripcion','Descripción','textarea',true),date('fecha','Fecha de registro',true)]},
      {key:'clinico',label:'Historial clínico',description:'Enfermedades, discapacidades, atención y riesgos psicosociales.',fields:[f('enfermedades','Enfermedades crónicas','textarea'),yes('discapacidad','Discapacidad permanente',true),f('tipoDiscapacidad','Tipo de discapacidad','text',true,{dependsOn:{key:'discapacidad',equals:'si'}}),yes('atencion','Recibe atención psicológica o psiquiátrica',true),yes('riesgos','Identificación de riesgos psicosociales',true),f('tipoRiesgos','Tipo de riesgos psicosociales','textarea',true,{dependsOn:{key:'riesgos',equals:'si'}})]},
      {key:'condicion',label:'Condición laboral',description:'Registro de incapacidades laborales.',fields:[yes('incapacidades','Cuenta con incapacidades registradas',true)],sections:[{title:'Incapacidades',fields:[f('tipo','Tipo de incapacidad','text',true),date('inicio','Fecha de inicio de incapacidad',true),date('fin','Fecha de término de incapacidad',true),f('dias','Días de incapacidad','number',true,{min:1}),f('motivo','Motivo de incapacidad','textarea',true)]}]}
    ]
  }
};

export const MODULO_KEYS: readonly ModuloKey[] = ['formacion-academica','profesionalizacion','estimulos','separacion','salud'];
export function isModuloKey(key: string): key is ModuloKey { return MODULO_KEYS.some(item => item === key); }

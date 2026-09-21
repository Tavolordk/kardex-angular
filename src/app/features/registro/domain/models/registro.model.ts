export type RegistroStepKey = 'identificacion' | 'origen' | 'contacto' | 'fotografia';

export interface EmergencyContact {
  id: string;
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface RegistroDraft {
  curp: string;
  cuip: string;
  numeroNomina: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  sexo: string;
  identidadGenero: string;
  nacionalidad: string;
  entidadNacimiento: string;
  municipioNacimiento: string;
  estadoCivil: string;
  licenciaConducir: 'si' | 'no';
  numeroLicencia: string;
  documentoLicenciaNombre: string;
  documentoLicenciaDataUrl: string;
  gruposVulnerables: string[];
  dependientes: string;
  entidadResidencia: string;
  municipioResidencia: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  codigoPostal: string;
  telefono: string;
  correo: string;
  contactosEmergencia: EmergencyContact[];
  fechaToma: string;
  vigenciaFotografia: string;
  origenCaptura: string;
  biometrico: 'si' | 'no';
  photoDataUrl: string;
  photoName: string;
}

export const EMPTY_REGISTRO_DRAFT: RegistroDraft = {
  curp: '',
  cuip: '',
  numeroNomina: '',
  nombres: '',
  primerApellido: '',
  segundoApellido: '',
  fechaNacimiento: '',
  sexo: '',
  identidadGenero: '',
  nacionalidad: '',
  entidadNacimiento: '',
  municipioNacimiento: '',
  estadoCivil: '',
  licenciaConducir: 'no',
  numeroLicencia: '',
  documentoLicenciaNombre: '',
  documentoLicenciaDataUrl: '',
  gruposVulnerables: [],
  dependientes: '',
  entidadResidencia: '',
  municipioResidencia: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  colonia: '',
  codigoPostal: '',
  telefono: '',
  correo: '',
  contactosEmergencia: [],
  fechaToma: '',
  vigenciaFotografia: '3 años desde la fecha de toma',
  origenCaptura: 'Expediente de ingreso',
  biometrico: 'si',
  photoDataUrl: '',
  photoName: ''
};

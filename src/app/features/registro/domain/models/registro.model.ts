export type RegistroStepKey = 'identificacion' | 'origen' | 'contacto' | 'fotografia';

export interface RegistroDraft {
  curp: string;
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
  vulnerabilidad: string;
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
  nombreContactoEmergencia: string;
  contactoEmergencia: string;
  fechaToma: string;
  biometrico: 'si' | 'no';
  identificadorReferencia: string;
  photoDataUrl: string;
  photoName: string;
}

export const EMPTY_REGISTRO_DRAFT: RegistroDraft = {
  curp: '', nombres: '', primerApellido: '', segundoApellido: '', fechaNacimiento: '', sexo: '',
  identidadGenero: '', nacionalidad: '', entidadNacimiento: '', municipioNacimiento: '', estadoCivil: '',
  vulnerabilidad: '', dependientes: '', entidadResidencia: '', municipioResidencia: '', calle: '',
  numeroExterior: '', numeroInterior: '', colonia: '', codigoPostal: '', telefono: '', correo: '',
  nombreContactoEmergencia: '', contactoEmergencia: '', fechaToma: '', biometrico: 'si',
  identificadorReferencia: 'CURP-BIO-9923847-X', photoDataUrl: '', photoName: ''
};

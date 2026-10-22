import { RegistroDraft } from '../../features/registro/domain/models/registro.model';

export interface InitialReviewSection {
  title: string;
  complete: boolean;
  missing: string[];
}

/** Las mismas condiciones obligatorias utilizadas al finalizar Datos personales. */
export function reviewInitialRegistration(draft: RegistroDraft): InitialReviewSection[] {
  const populated = (value: unknown): boolean => Array.isArray(value)
    ? value.length > 0
    : typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
  const mexican = draft.nacionalidad.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().includes('MEX');
  const definitions: Array<{ title: string; required: Array<[keyof RegistroDraft, string]> }> = [
    { title: 'Identificación básica', required: [
      ['curp', 'CURP'], ['numeroNomina', 'Número de nómina'], ['nombres', 'Nombre(s)'],
      ['primerApellido', 'Primer apellido'], ['fechaNacimiento', 'Fecha de nacimiento'],
      ['sexo', 'Sexo'], ['nacionalidad', 'Nacionalidad'],
      ...(mexican ? ([['entidadNacimiento', 'Entidad de nacimiento'], ['municipioNacimiento', 'Municipio de nacimiento']] as Array<[keyof RegistroDraft, string]>) : []),
      ['estadoCivil', 'Estado civil'],
      ...(draft.licenciaConducir === 'si' ? ([['numeroLicencia', 'Número de licencia'], ['documentoLicenciaDataUrl', 'Documento de licencia']] as Array<[keyof RegistroDraft, string]>) : [])
    ] },
    { title: 'Origen y residencia', required: [
      ['entidadResidencia', 'Entidad de residencia'], ['municipioResidencia', 'Municipio de residencia'],
      ['calle', 'Calle'], ['codigoPostal', 'Código postal']
    ] },
    { title: 'Contacto', required: [['contactos', 'Medio de contacto']] },
    { title: 'Fotografía y biométricos', required: [['photoDataUrl', 'Fotografía']] }
  ];
  return definitions.map(section => {
    const missing = section.required.filter(([key]) => {
      if (!populated(draft[key])) return true;
      if (key === 'curp') return draft.curp.trim().length !== 18;
      if (key === 'codigoPostal') return !/^\d{5}$/.test(draft.codigoPostal.trim());
      return false;
    }).map(([, label]) => label);
    return { title: section.title, complete: missing.length === 0, missing };
  });
}

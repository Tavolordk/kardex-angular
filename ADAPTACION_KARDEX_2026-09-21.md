# Adaptación Kardex Policial — 21/09/2026

Este paquete contiene cambios reales sobre la implementación activa de `/registro`.

## Identificación
- Se agregaron CUIP y número de nómina.
- Se agregó captura de licencia de conducir Sí/No.
- Se agregó número de licencia y carga de documento PDF/JPG/PNG (máximo 5 MB).
- La condición de vulnerabilidad simple se sustituyó por selección múltiple de grupos vulnerables.

## Contacto
- Teléfono y correo quedan como datos principales.
- Los contactos de emergencia ahora se administran como una colección.
- Se agregó botón **Agregar contacto**.
- Se agregaron tarjetas para contactos registrados.
- Se agregó modal para alta/edición con nombre, teléfono y parentesco.
- Se agregó eliminación de contactos.

## Fotografía
- Se conserva la carga JPG/PNG con requisitos tipo pasaporte.
- Se guardan fecha de toma, vigencia y origen de captura.
- Se conserva el selector de biométrico Sí/No.
- Se eliminó `identificadorReferencia` de la implementación activa.

## Persistencia
- El modelo de borrador cambió a la versión nueva.
- La clave localStorage ahora es `kardex.registro.draft.v2`.

## Archivos principales modificados
- `src/app/features/registro/domain/models/registro.model.ts`
- `src/app/features/registro/infrastructure/local-storage-registro.repository.ts`
- `src/app/features/registro/presentation/pages/registro-page/registro-page.component.ts`
- `src/app/features/registro/presentation/components/identificacion-form/*`
- `src/app/features/registro/presentation/components/contacto-form/*`
- `src/app/features/registro/presentation/components/fotografia-form/*`

Consulta `CAMBIOS_KARDEX.patch` para ver el diff línea por línea contra el proyecto recibido.

# Integración KardexSaveApi — borradores

## Endpoint y autenticación

Los accesos del proyecto utilizan el proxy de Angular (`proxy.conf.cjs`), y admite `SAVE_API_PROXY_TARGET` si KardexSaveApi corre en otro host. Por defecto usa `API_PROXY_TARGET`.
El servicio agrega `Authorization: Bearer <accessToken>` de la sesión confirmada mediante `verificar-codigo`.

- `POST /api/save/Save/cedula-temporal`: alta (`idBorrador: null`) o actualización (`idBorrador` existente). Body `{ idBorrador, seccion, cedula: { curp, secciones } }`.
- `GET /api/save/Save/cedula-temporal/{idBorrador}`: recupera y reconstruye los campos compatibles del frontend y los historiales locales.
- `DELETE /api/save/Save/cedula-temporal/{idBorrador}`: descarta el borrador confirmado por API desde Menú (con confirmación previa).
- El endpoint `POST /api/save/Save/cedula` **NO** se invoca: es el guardado definitivo, no el temporal solicitado.

El `idBorrador` recibido se conserva por `userId` en `localStorage` bajo `kardex.save.idBorrador.v1:<userId>`. No se envían identificadores inventados. Los campos `CatalogoRef` se envían con `descripcion` (el frontend persistía las etiquetas, no el ID real del catálogo). Las fechas del formulario se serializan en ISO date-time. Las secciones que existen en Kardex son `datosPersonales`, `reclutamientoSeleccion`, `condicionesLaborales`.

El formulario personal permite `Guardar borrador`, `Guardar y continuar` y `Volver al menú`; las dos secciones de captura restantes permiten Guardar borrador y Finalizar apartado. Los paneles continúan con persistencia local como respaldo hasta que haya confirmación del POST. Los errores 0/400/401/500 no se anuncian como éxitos.

## Limitaciones reales del contrato

- **Fotografía y anexos**: el contrato expone `ArchivoRef { nombre, ruta }` pero no proporciona un endpoint de subida. No se envían data URLs como rutas ficticias; la imagen y el documento de licencia se mantienen en el respaldo local hasta contar con un servicio de almacenamiento.
- **Algunos atributos de UI no existen en CedulaRequest**: nacionalidad, tipo/factor sanguíneo y campos ampliados de nómina; se preservan localmente pero no pueden restaurarse en otro equipo desde este contrato.
- **Catálogos**: para mapear `CatalogoRef.id` con certeza harán falta catálogos cuya correspondencia ID↔etiqueta se entregue o preserve explícitamente; el mapper evita asignar IDs por suposición.
- **Recuperación interdispositivo**: el Swagger solo ofrece GET por identificador de borrador y no lista de borradores por usuario. El `idBorrador` se conoce después del primer POST exitoso y se almacena en el navegador actual; en otro equipo se necesita un mecanismo de descubrimiento de IDs para restauración automática.
- **Pruebas backend**: falta validación de respuestas reales, especialmente de los tipos `JsonNode` y del significado esperado de `seccion` (string sin enum en OpenAPI). Se envían nombres equivalentes a `SeccionesRequest`.

## Prueba de integración

1. Iniciar sesión y abrir `Datos personales`, escribir CURP y datos parciales.
2. Pulsar `Guardar borrador`; confirmar HTTP 200 en DevTools y valor `data.idBorrador`.
3. Cambiar un campo y repetir: comprobar que se envía el **mismo** idBorrador.
4. Regresar a Menú y entrar al apartado: verificar el GET y la recuperación.
5. Agregar un proceso o una adscripción, guardar borrador, confirmar `secciones.reclutamientoSeleccion` / `secciones.condicionesLaborales`.
6. Simular error de red/401: debe verse error y nunca «Borrador guardado en el servidor».
7. Desde Menú seleccionar «Descartar borrador», confirmar y revisar DELETE.

No borrar el `localStorage` del usuario de pruebas hasta verificar la recuperación.

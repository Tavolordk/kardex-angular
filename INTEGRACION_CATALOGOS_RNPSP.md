# Catálogos de Kardex — integración de front

## Endpoints

El servicio `src/app/features/catalogos/infrastructure/catalogos.service.ts` conserva
los 21 endpoints GET de `/api/catalogos/Catalogos/{nombre}` del Swagger facilitado.

Se integró `GET /api/catalogos/CatalogosRnpsp/get-catalogo/{id}` con IDs:

| ID | RNPSP | Uso |
|---:|---|---|
| 1 | Nacionalidad | Identificación: nacionalidad RNPSP (independiente del país de nacimiento) |
| 2 | Tipo de sangre | Identificación |
| 3 | Factor de sangre | Identificación |
| 5 | Entidad | Nacimiento, domicilio y adscripción |
| 6 | Municipio | Nacimiento, domicilio y adscripción, con `?idEntidad=<id-real>` |
| 8 | Delito | Disponible mediante `delitosRnpsp()`, sin formulario de delito en el proyecto recibido |
| 9 | Tipo de arma | Condiciones laborales, portación de armas |
| 10 | Jerarquía | Condiciones laborales, adscripción |

La integración también conecta `/situacion-laboral`, `/institucion-seguro-social`,
`/institucion-seguro-social-vivienda`, `/mecanismo-financiamiento` y `/tipo-vivienda`.
Los demás endpoints nombrados siguen disponibles en el servicio, aunque no se
inventaron campos para catálogos que no tienen una sección correspondiente.

## Compatibilidad

- Se mantienen los nombres y estilos de componentes Angular 21.
- El valor guardado del selector es su descripción (texto), conservando compatibilidad
  con registros y borradores previamente almacenados en `localStorage`.
- El ID real recibido del backend se conserva en `CatalogoOption.id` para enviar
  `idEntidad` numérico al solicitar municipios. Nunca se inventan IDs.
- Un cambio de entidad limpia el municipio anterior; se impide aplicar respuestas
  atrasadas si se cambia de entidad antes de terminar la petición.
- Errores de red muestran un mensaje en el formulario. No hay datos simulados.
- El proxy local existente enruta `/api` hacia `API_PROXY_TARGET` (predeterminado
  en `proxy.conf.cjs`). No se cambió la configuración ni el contrato de backend.

## Validación de integración

La especificación OpenAPI compartida documenta rutas y parámetros, pero **no
incluye los esquemas JSON de respuesta**. El normalizador admite respuestas
arreglo y envoltorios habituales (`data`, `resultado`, `result`, etc.), además de
campos como `id`, `idEntidad`, `descripcion`, `nombre` en variantes de mayúsculas,
guiones bajos y acentos. Es imprescindible probar con una respuesta REAL de cada
endpoint del entorno correspondiente antes de dar por validada la integración.

En una máquina con dependencias instaladas:

```powershell
npm ci
npm run build
$env:API_PROXY_TARGET='http://TU_BACKEND:PUERTO'
npm start
```

Comprobar con DevTools > Network que al elegir entidad se invoca
`/api/catalogos/CatalogosRnpsp/get-catalogo/6?idEntidad=NUMERO` y que la respuesta
contiene los municipios de la entidad seleccionada. Revisar identificación,
residencia, adscripción, jerarquía, armas, situación laboral y prestaciones.

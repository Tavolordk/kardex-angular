# Catálogos y verificación OTP

## Catálogos

Se agregó `CatalogosService` con las 21 rutas publicadas por `KardexCatalogosApi`, consumidas bajo `/api/catalogos/Catalogos/*`. El proxy del proyecto resuelve `/api` contra `http://10.237.3.101:4600` por defecto.

La pantalla de Datos personales consume actualmente:
- sexo
- identidad-genero
- pais
- estado-civil
- tipo-vulnerabilidad

El resto de métodos queda disponible para las pantallas posteriores. Entidad federativa y municipio no se modificaron porque no existen rutas equivalentes en el Swagger recibido.

Como el Swagger de catálogos no declara el schema del response 200, el servicio normaliza arreglos directos y respuestas envueltas en `data`, `result`, `resultado`, `items`, `catalogo` o `catalogos`.

## OTP

- Se eliminaron los seis dígitos dummy del formulario.
- Los inputs empiezan vacíos.
- Cada dígito usa `type="password"` e `inputmode="numeric"`.
- Al solicitar o reenviar un código el formulario OTP se limpia.
- El código real continúa enviándose al endpoint `POST /api/login/Login/verificar-codigo`.

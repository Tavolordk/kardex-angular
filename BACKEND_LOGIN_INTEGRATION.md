# Integración Login KARDEX

- Base local vía proxy: `/api/login/Login`
- Proxy por defecto: `http://10.237.3.101:4600`
- `valida-user`: envía siempre `correo`, `celular`, `medioContacto`.
- Mapeo de canal: correo -> `CORREO`, SMS -> `SMS`, Telegram -> `TELEGRAM`.
- `verificar-codigo`: usa `Authorization: Bearer <preAuthToken>` y envía `canal`, `contacto`, `codigo`.
- La sesión persistida usa `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `expiresAtUtc`, `sessionExpiresAtUtc`, `sid`.
- `cerrar-sesion` se invoca antes de limpiar localStorage.
- El captcha continúa validándose en el frontend porque no forma parte del contrato Swagger compartido.

## Ajuste visual posterior
Aunque `correo` y `celular` son obligatorios para `DatosUserRequest`, ambos se mantienen uno debajo del otro para conservar la composición visual del login. El cambio es únicamente de layout; el request sigue enviando ambos campos.

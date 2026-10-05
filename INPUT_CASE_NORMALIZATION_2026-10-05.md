# Normalización de mayúsculas/minúsculas

Se agregó `InputCaseDirective` para normalizar la captura real en formularios.

- Captcha: MAYÚSCULAS.
- Campos de texto posteriores al inicio de sesión: MAYÚSCULAS.
- Correo electrónico: minúsculas.
- Fechas, números, teléfono, checkbox, radio y archivos: no modifican su valor técnico.
- Selects/opciones se presentan visualmente en MAYÚSCULAS sin modificar sus códigos/IDs de backend.

También se normaliza defensivamente el correo al guardar el borrador y el captcha/correo antes de enviarlos desde Login.

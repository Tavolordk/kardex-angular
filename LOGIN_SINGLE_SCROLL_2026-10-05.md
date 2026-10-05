# Login - scroll único del navegador

Ajuste responsive solicitado el 2026-10-05.

- Se elimina el `overflow-y: auto` del contenedor `.login-shell`.
- El login ya no crea un segundo scroll vertical interno.
- El crecimiento vertical del formulario queda a cargo del documento y, por lo tanto, del scrollbar externo del navegador.
- Se conserva únicamente el recorte horizontal para impedir scroll lateral accidental.
- No se modifica la integración de Login, Captcha, OTP ni Catálogos.

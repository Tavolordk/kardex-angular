# Integración de captcha backend

Se reemplazó el captcha local por los endpoints del KardexLoginApi:

- GET `/api/login/Captcha/genera-captcha`
- POST `/api/login/Captcha/validar-captcha`

Flujo:
1. Al cargar el login se solicita un captcha al backend.
2. Se muestra `data.imageBase64` y se conserva `data.id` en memoria.
3. Al continuar se valida `{ id, answer }` antes de llamar a `valida-user`.
4. Si el captcha es incorrecto se marca el campo, se muestra el error y se genera uno nuevo.
5. El `token` retornado por `validar-captcha` se conserva en memoria, pero no se adjunta a `valida-user` porque el Swagger compartido no declara ese token como header ni como parte de `DatosUserRequest`.
6. El botón de refrescar vuelve a consumir `genera-captcha`; ya no existe generación local/dummy.

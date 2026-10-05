# Captcha: 5 caracteres alfanuméricos

- Longitud exacta: 5 caracteres.
- Caracteres permitidos: A-Z y 0-9.
- Conversión automática a mayúsculas.
- Caracteres no alfanuméricos se eliminan al escribir o pegar.
- El submit valida `^[A-Z0-9]{5}$` antes de llamar al backend.

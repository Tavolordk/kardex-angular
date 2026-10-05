# Ajuste responsive de escritorio — KARDEX

Fecha: 2026-10-05

## Alcance

Se ajustaron únicamente estilos/layout de las pantallas ya implementadas. No se modificaron contratos HTTP, servicios de Login, Captcha, OTP ni Catálogos.

Pantallas cubiertas:
- Login / verificación OTP.
- Datos personales.
- Residencia.
- Contacto.
- Propuesta contacto / modal de contacto de emergencia.
- Fotografía y biométricos.
- Header institucional, sidebar, ayuda, navegación de pasos y encabezado de sección.

## Criterio responsive

- 1920 px conserva la geometría de referencia de Figma.
- 1181–1919 px usa anchos fluidos para escritorio/laptop y elimina los min-width que provocaban overflow.
- 1181–1499 px reorganiza formularios densos a dos columnas cuando es necesario.
- <=1180 px conserva el comportamiento tablet existente.
- <=900 px conserva menú lateral móvil y contenido de una columna cuando corresponde.
- >=2200 px amplía de forma limitada el área de trabajo para que el sistema no se perciba demasiado pequeño en monitores 2K/4K.
- Login en pantallas de poca altura permite scroll vertical en vez de recortar o reducir demasiado los controles.

## Cambios principales

- Tarjetas de registro: `width: 100%`, `max-width` y alturas desbloqueadas fuera de la resolución Figma.
- Formulario: grids de 3 a 2 columnas en escritorio compacto.
- Contacto: columnas, tarjetas de emergencia y modal fluidos.
- Fotografía: columnas flexibles y selector biométrico adaptable.
- Panel de ayuda, sidebar y header: dimensiones interpoladas para escritorio compacto.
- Navegación de pasos: tipografía/iconos reducidos gradualmente en laptops.
- Login: ancho interpolado con `clamp()`, contenido interno porcentual y soporte para escritorios de poca altura.

## Validación

Se validó el balance de llaves de todos los archivos SCSS. El build Angular completo no se ejecutó porque `npm ci --ignore-scripts` no terminó dentro del tiempo disponible y no había `node_modules` previamente instalados.

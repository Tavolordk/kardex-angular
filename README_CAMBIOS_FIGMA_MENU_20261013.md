# Kardex SSPC — actualización de menú desde Figma

Referencia: `https://www.figma.com/design/vgcYYvez0oiB6aoAEEANuK/KARDEX-compartido--Copy-?node-id=426-260&m=dev`
Pantalla de menú: nodo `731:658`, sidebar: `731:679`.

## Actualizaciones

- Se agrega `/menu`, tablero de **11 tarjetas** según Figma con responsive a cuatro, tres, dos y una columnas, indicador de progreso y botones de acceso.
- Sidebar de **3 módulos**: Registro, Consulta y Administración (solo Registro tiene una ruta implementada; los otros dos quedan visibles pero inactivos).
- El inicio de sesión y el guard de invitados dirigen al menú como punto de entrada.
- Las cinco tarjetas existentes abren `/registro?seccion=...` en el apartado correspondiente. Las otras seis no simulan acciones sin backend ni pantalla.
- El formulario conserva los controles existentes, las validaciones para avanzar, la navegación sin carrusel y la altura dinámica de Adscripción corregida anteriormente.
- Desde Registro aparece un enlace de regreso al tablero.
- El logotipo del encabezado institucional utiliza una variante con tipografía clara sobre fondo oscuro.
- Porcentajes del menú: Datos personales desde el borrador local, Reclutamiento y Condiciones laborales desde datos locales registrados, Certificación desde estándares locales y Control de confianza 0 mientras no exista integración ECCC.

## Instalación

1. Haz un respaldo de tu proyecto actual.
2. Descomprime el ZIP completo encima de tu proyecto, reemplazando los archivos existentes. No reemplaces tu configuración de ambiente si es personalizada.
3. Si usas el ZIP de actualización parcial, copia sus carpetas `src/` y `public/` al proyecto existente.
4. En PowerShell, desde el directorio del proyecto: `npm ci` (si no tienes dependencias) y `npm run start:local`.
5. Inicia sesión y comprueba `/menu`, `/registro?seccion=condiciones-laborales` y Adscripción en pantallas pequeñas y grandes.

## Verificación

Se realizó verificación de sintaxis TS y de integridad de los archivos empaquetados.
**No se ejecutó `ng build`**, porque este entorno no dispone de las dependencias del proyecto y no pudo instalarlas desde la red.

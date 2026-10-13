# Kárdex SSPC — navegación por apartados (UX) | 13 de octubre de 2026

## Flujo actualizado

1. Tras validar exitosamente el código de acceso de seis dígitos, abrir siempre `/menu` (se ignora el `returnUrl` anterior para el login). Las sesiones vigentes que abran `/login` también se redirigen a `/menu`.
2. El menú Figma `/menu` continúa como punto central. Mantiene los 11 módulos con acceso solo a los apartados implementados, y muestra avance local sin simular integraciones pendientes.
3. Cada apartado abre su propia pantalla en `/registro?seccion=...`. Ya NO aparece arriba un listado de pasos o apartados navegables.
4. Datos personales: se muestra un indicador discreto «Paso N de 4», sin botones de todos los subpasos. Avanza con «Guardar y continuar». El botón «Anterior» sirve para corregir; «Volver al menú» guarda el borrador.
5. Al finalizar Datos personales, Reclutamiento o Condiciones laborales se verifican sus requisitos existentes. Solo tras pasar la validación se presenta una tarjeta de confirmación con dos opciones: «Volver al menú» o «Continuar: [siguiente apartado]».
6. Datos personales valida **los cuatro formularios completos** al finalizar y guarda los datos. Si existen campos pendientes, abre el primer subformulario que requiere corrección. Al volver desde el menú, reanuda el primer formulario incompleto.
7. Control de confianza y Certificación individual son vistas de consulta o guardado de sus componentes respectivos; no se les atribuye un «guardado» global inventado.
8. Regresar al menú tras completar el apartado muestra una confirmación discreta y permite comenzar, continuar o revisar según el progreso local de cada apartado.
9. Se conserva la altura flexible y el scroll de Adscripción. Se retiraron controles «Guardar borrador» ajenos a Datos personales que guardaban otro formulario y podían confundir.

## Instalación

- **Actualización parcial:** descomprime el ZIP `KARDEX_UX_SOLO_SRC_20261013.zip` sobre tu proyecto, sustituyendo la carpeta `src/` (no modifica `package.json`, entornos ni configuración).
- **Proyecto completo:** descomprime `KARDEX_UX_MENU_POSTLOGIN_COMPLETO_20261013.zip` si deseas reemplazar la copia base completa. Realiza respaldo previo.
- En PowerShell, ejecuta `npm run start:local`; visita `http://localhost:4205/login`.

## Verificación

- Sintaxis analizada con el parser TypeScript en los 43 archivos `.ts`: sin errores sintácticos.
- Verificada la presencia de `/menu`, el nuevo flujo y la eliminación de ambos controles de navegación por pasos.
- No fue posible finalizar `npm ci` en este entorno (se agotó el tiempo de instalación), por lo que **no se confirma compilación Angular ni prueba end-to-end**. Debe verificarse mediante `npm run build` / `ng serve` en un entorno con `node_modules` disponibles.

## Alcance de persistencia

- Datos personales: borrador existente en el repositorio local del proyecto.
- Reclutamiento y Condiciones laborales: sus componentes actuales guardan en almacenamiento local mediante funciones propias.
- No se enviaron ni se inventaron peticiones a backend para simular un guardado global.

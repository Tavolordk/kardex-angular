# UI responsive + paneles auxiliares minimizables

## Cambios

- Las tarjetas **Instrucciones**, **Progreso por sección**, **Progreso general** y **Recomendación** se pueden minimizar individualmente.
- Su estado se conserva en `localStorage` (`kardex.helper-panels.v1`).
- Debajo de la tarjeta principal se agregó un dock de paneles:
  - Desktop: aparece al pasar el mouse o al recibir foco.
  - Dispositivos táctiles: aparece al tocar el control `Paneles`.
  - Cada icono alterna mostrar/ocultar su tarjeta.
- Cuando no hay paneles auxiliares visibles, el formulario aprovecha el ancho disponible.
- Responsive completo para header, sidebar off-canvas, encabezado de sección, navegación por pasos, formularios, fotografía, paneles y acciones.
- En móvil, los inputs usan 16px para evitar zoom automático en navegadores móviles.
- El sidebar móvil inicia cerrado y se abre con el botón flotante de menú.
- `npm start` y `npm run start:network` incluyen `--poll 1000` para mejorar hot reload en Windows/OneDrive.

## Archivos principales

- `src/app/features/registro/presentation/pages/registro-page/*`
- `src/app/shared/ui/help-panel/*`
- `src/app/shared/ui/utility-dock/*`
- `src/app/shared/ui/helper-panel.model.ts`
- `src/app/shared/ui/step-navigation/step-navigation.component.scss`
- `src/app/shared/ui/section-header/section-header.component.scss`
- `src/app/shared/layout/institutional-header/institutional-header.component.scss`
- `src/app/shared/layout/sidebar/sidebar.component.scss`
- `src/app/features/registro/presentation/components/form-sections.scss`
- `src/app/features/registro/presentation/components/fotografia-form/fotografia-form.component.scss`

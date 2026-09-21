# Adaptación Figma → nuevo proyecto Angular

Fuente visual: `KARDEX compartido (Copy)` / nodo `0:1`.

## Implementación activa

- `src/app/features/registro/presentation/pages/registro-page/` — composición principal.
- `src/app/features/registro/presentation/components/` — formularios por sección.
- `src/app/shared/layout/` — encabezado institucional y menú lateral.
- `src/app/shared/ui/` — navegación, paneles de ayuda, progreso y dock.
- `src/app/features/registro/application/` — fachada de navegación/guardado.
- `src/app/features/registro/domain/` — modelos y contrato de repositorio.
- `src/app/features/registro/infrastructure/` — persistencia dummy con `localStorage`.
- `public/assets/` — branding e iconografía provenientes del Figma.

## Decisiones de adaptación

1. Angular 21 standalone y lazy loading para `/registro`.
2. La UI de Figma se tradujo a componentes Angular reutilizables; no se conserva código React/Tailwind como dependencia.
3. Los formularios son reactivos y ya incluyen validaciones base.
4. El progreso se calcula con los campos obligatorios reales.
5. La fotografía valida JPG/PNG y máximo 2 MB, con preview local.
6. El borrador está desacoplado mediante `RegistroRepository`, listo para sustituirse por HTTP/API.
7. Se eliminó la segunda implementación monolítica `src/app/registro-page.*` para evitar mantenimiento duplicado.
8. El servidor local del proyecto usa el puerto `4205`.

## Integración backend siguiente

Para conectar API real, implementar `RegistroRepository` con un adaptador HTTP y cambiar el provider del `RegistroPageComponent`. La capa de presentación no necesita reescribirse.

## Nota de verificación

Los assets del Figma ya están materializados localmente en `public/assets`. La lectura remota adicional del archivo Figma quedó limitada por la cuota MCP del plan Figma durante esta sesión, por lo que esta adaptación se consolidó sobre los assets y la implementación Figma ya presentes en el proyecto recibido.

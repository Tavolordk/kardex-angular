# Ajuste Figma — pantallas de Registro

Referencia: archivo Figma `KARDEX compartido`, página/nodo `0:1`.

## Alcance aplicado

- Se conserva sin cambios funcionales la implementación del login ya terminada.
- Se ajusta la composición de las pestañas del módulo Registro sobre la arquitectura Angular existente.
- Se corrigen títulos visibles para coincidir con el diseño: `Información básica`, `Residencia`, `Contacto` y `Fotografía y biométricos`.
- El encabezado institucional visible cambia a `Kárdex SSPC`.
- Se alinea el layout de escritorio de 1920 px con las medidas recuperadas del Figma:
  - header: 64 px;
  - menú lateral: 240 px;
  - encabezado de sección: ~77 px;
  - panel auxiliar: 260 px;
  - zona de formulario: 1278 px;
  - tarjeta principal: 1174 px;
  - separación panel/formulario: 22 px;
  - flechas: 42 px;
  - desplazamiento izquierdo del bloque de registro: 80 px dentro del área principal.
- El panel auxiliar usa las alturas del frame de referencia: 227 / 235 / 107 / 139 px.
- La pestaña `Fotografía y biométricos` se recompone conforme al frame Figma:
  - dos columnas iguales para fotografía y carga/requisitos;
  - área de fotografía de 198 px;
  - control de carga de 58 px;
  - bloque de requisitos de 128 px;
  - selector biométrico de 362.67 px;
  - contador `1 REQ.`.
- Se conserva la lógica existente de guardado de borrador, fotografía, navegación, paneles minimizables, autenticación y responsive.

## Archivos principales modificados

- `src/app/features/registro/presentation/pages/registro-page/registro-page.component.ts`
- `src/app/features/registro/presentation/pages/registro-page/registro-page.component.html`
- `src/app/features/registro/presentation/pages/registro-page/registro-page.component.scss`
- `src/app/features/registro/presentation/components/fotografia-form/fotografia-form.component.html`
- `src/app/features/registro/presentation/components/fotografia-form/fotografia-form.component.scss`
- `src/app/shared/layout/institutional-header/institutional-header.component.html`
- `src/app/shared/ui/help-panel/help-panel.component.html`
- `src/app/shared/ui/help-panel/help-panel.component.scss`
- `src/app/shared/ui/step-navigation/step-navigation.component.scss`

## Verificación realizada

- Sintaxis TypeScript de los componentes modificados: OK.
- `git diff --check` sobre los archivos modificados: OK.
- No fue posible ejecutar `ng build` dentro del entorno de trabajo porque el ZIP no incluye `node_modules` y la caché local no contiene todas las dependencias requeridas por Angular 21.

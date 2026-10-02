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

## Login y autenticación (2026-10-02)

- Se agregó `/login` con las dos vistas del nodo Figma `426:260`: credenciales y verificación de identidad.
- `/registro` queda protegido por `authGuard`; una sesión válida redirige fuera de `/login` y el botón de cierre de sesión elimina la sesión.
- La autenticación se organizó como feature independiente con `domain / application / infrastructure / presentation`.
- `AuthRepository` es el puerto de dominio. Los casos de uso (`RequestVerificationUseCase`, `VerifyAccessCodeUseCase`, `GetCurrentSessionUseCase`, `SignOutUseCase`) no dependen de Angular.
- `LocalStorageAuthRepository` es un adaptador local reemplazable por HTTP sin reescribir la presentación ni los casos de uso.
- El adaptador local usa `481027` como OTP de demostración (precargado en la UI) y persiste una sesión temporal de 8 horas.
- El captcha se valida localmente para la demo y puede sustituirse por el servicio institucional cuando exista contrato de backend.
- La descarga adicional de assets específicos del login quedó bloqueada por el límite de llamadas MCP del plan Figma; se reutilizó el branding ya materializado y se añadieron iconos locales del mismo lenguaje visual. El layout, medidas y copy se tomaron del screenshot/metadata del nodo compartido.

# Kárdex Policial SSPC — Angular

Frontend Angular construido a partir del Figma compartido de Kárdex. La versión actual usa datos/catálogos dummy, pero la estructura separa dominio, aplicación, infraestructura y presentación para que la integración con APIs no requiera reescribir la UI.

## Ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:4200/registro`.

`npm install` y `npm start` ejecutan `npm run assets:figma`. Ese comando materializa en `public/assets` los PNG/SVG originales exportados desde el Figma y omite cualquier archivo que ya exista. La aplicación en ejecución referencia solamente `/assets/...` locales.

## Arquitectura

```text
src/app/
├── core/
│   └── constants/                  # rutas y configuración transversal
├── shared/
│   ├── layout/                     # header y sidebar institucionales
│   └── ui/                         # header de sección, progreso y step navigation
└── features/registro/
    ├── domain/
    │   ├── models/                 # entidades y tipos del registro
    │   └── repositories/           # contrato de persistencia
    ├── application/                # fachada/casos de uso de borrador y navegación
    ├── infrastructure/             # implementación dummy en localStorage
    └── presentation/
        ├── pages/registro-page/    # composición/orquestación de la pantalla
        └── components/             # formularios por sección
```

## Assets

```text
public/assets/
├── branding/seguridad-sspc.png
└── icons/
    ├── dashboard.svg
    ├── consolidation.svg
    ├── registro.svg
    ├── search.svg
    ├── administration.svg
    ├── identification.svg
    ├── origin.svg
    ├── contact.svg
    ├── camera.svg
    └── ...
```

Los assets son exportaciones del Figma; no se dibujan iconos sustitutos con caracteres o SVG inventados.

## Funcionalidad dummy incluida

- Navegación libre por las cuatro secciones.
- Formularios reactivos y validadores obligatorios.
- Progreso por sección y progreso general calculado desde los campos reales.
- Guardado de borrador asíncrono mediante `RegistroRepository`.
- Repositorio dummy persistente en `localStorage`.
- Carga, validación, preview y eliminación de fotografía JPG/PNG de máximo 2 MB.
- Selector de registro biométrico.
- Layout responsive para desktop, tablet y móvil.
- Lazy loading de la feature `/registro`.

## Reemplazar dummy por backend

Crear otra clase que implemente `RegistroRepository` y sustituir el provider de `LocalStorageRegistroRepository`. Los componentes y la fachada no dependen de HTTP ni conocen el origen de los datos.

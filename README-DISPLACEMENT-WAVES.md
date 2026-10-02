# Kardex - ondas reales con PixiJS DisplacementFilter

Este patch reemplaza la animación anterior (copias del mismo PNG desplazándose) por una deformación real de píxeles usando `DisplacementFilter` de PixiJS v8.

## Copiar
Descomprime este ZIP en la raíz del proyecto Angular para que reemplace/agregue:

- `src/app/shared/ui/animated-wave-background/animated-wave-background.component.ts`
- `src/app/shared/ui/animated-wave-background/animated-wave-background.component.scss`
- `public/assets/login/wave-displacement.png`

El proyecto debe conservar también:

- `public/assets/login/1921.png`
- `pixi.js` instalado (`npm install pixi.js`)

## Probar

```powershell
npm start
```

Modo normal:

`http://localhost:4205/login`

Modo de diagnóstico, con deformación deliberadamente exagerada:

`http://localhost:4205/login?waveDebug=1`

Si el modo debug tampoco se mueve, abre DevTools y revisa:

```javascript
const host = document.querySelector('app-animated-wave-background .canvas-host');
const canvas = document.querySelector('app-animated-wave-background canvas');
console.log({
  status: host?.dataset?.waveStatus,
  canvas: !!canvas,
  mode: canvas?.dataset?.kardexWaves,
  debug: canvas?.dataset?.waveDebug
});
```

Esperado:

```text
status: "ready"
canvas: true
mode: "displacement-active"
```

También verifica el mapa:

```javascript
fetch('/assets/login/wave-displacement.png').then(r => console.log(r.status, r.ok));
```

Debe devolver `200 true`.

# Animación PixiJS del fondo Kardex

Requisito ya ejecutado por el proyecto:

```bash
npm install pixi.js
```

Copiar la carpeta `src/` sobre el proyecto actual.

La animación:
- conserva `/assets/login/1921.png` como fondo fijo;
- superpone cuatro capas PixiJS recortadas a las zonas de ondas;
- mueve cada capa horizontalmente con velocidades y amplitudes diferentes;
- pausa el ticker cuando la pestaña queda oculta;
- se desactiva en `prefers-reduced-motion` y en pantallas <= 680 px.

Parámetros principales para ajustar el efecto están en:
`src/app/shared/ui/animated-wave-background/animated-wave-background.component.ts`

Cada capa tiene `alpha`, `amplitudeX`, `amplitudeY` y `speed`.

# Login Kárdex — réplica Figma

Nodo de referencia: `426:260`.

## Fondo corregido

Se revisó el proyecto original completo y su sistema visual. El proyecto usa como base institucional los tonos `#1b222b`, `#455163`, `#5d6b7e`, `#728196`, `#8798ad`, `#aeb9c7` y `#c5ced9`, junto con brillos radiales, superficies translúcidas y blur.

La primera versión del login había introducido un fondo SVG demasiado simplificado y, además, se renderizaba con `background-size: cover`, lo que recortaba y desplazaba la composición de ondas respecto al frame Figma de 1920 × 1024.

La corrección actual:

- reconstruye la composición con la paleta y materialidad del proyecto;
- aumenta la densidad de curvas, mallas, ribbons, partículas y brillos del diseño;
- mantiene el fondo en coordenadas 1920 × 1024;
- usa `background-size: 100% 100%` en escritorio para conservar la posición relativa de cada elemento del frame;
- usa escalado vertical controlado en móvil para evitar el recorte agresivo de `cover`;
- mantiene el asset local, sin depender de URLs temporales de Figma.

Asset principal: `public/assets/login/kardex-login-background.svg`.

# Corrección modal Reclutamiento y selección

Referencia Figma: `321:1125` / tarjeta `321:1143`.

- Figma: modal 1174 × 429 px en escritorio, contenido 1172 × 352 px, formulario 1124 × 264 px y footer 1172 × 76 px.
- Se corrigió el recorte provocado por el `overflow:hidden` + `backdrop-filter` de la tarjeta contenedora.
- Mientras un modal de Reclutamiento o Certificación está abierto, la tarjeta padre libera el clipping desde estilos globales.
- En escritorio compacto/laptop el modal ya no usa scroll interno forzado: aumenta su altura según el contenido y el desplazamiento, si hace falta, ocurre en el backdrop del modal.
- Se aplicó la misma protección al modal de Certificación y su vista de detalle.

## Estructura encontrada en Figma

Reclutamiento y selección (`320:794`) solo contiene dos frames principales:
- `320:795` Reclutamiento y selección histórico
- `321:1125` Modal reclutamiento y selección

Certificación (`321:1578`) solo contiene dos frames principales:
- `321:1586` Histórico de certificaciones
- `321:1746` Modal certificación

El contador `1 /4` visible en Certificación no corresponde a cuatro frames adicionales dentro de ese canvas.

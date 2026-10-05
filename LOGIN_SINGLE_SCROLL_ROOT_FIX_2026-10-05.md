# Corrección definitiva de doble scroll en Login

Se corrigió la propiedad global de overflow para que el único contenedor de scroll vertical sea el documento (`html`).

- `html`: `overflow-x: clip; overflow-y: auto;`
- `body`: `overflow: visible;`
- `login-shell`: `overflow: visible;`

La causa del segundo scrollbar era `overflow-x: hidden` aplicado a `body`, que en navegadores puede convertir el eje vertical de `body` en un scroll container independiente.

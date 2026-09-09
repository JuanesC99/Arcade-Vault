# Arcade Vault

Un salón recreativo hecho a mano: catorce juegos en HTML, CSS y JavaScript puro, más una tienda que los reúne. Sin frameworks, sin dependencias y sin paso de compilación. Se abre y se juega.

## Jugar

Abre `04-arcade-vault/index.html` en el navegador. Desde ahí se llega a las catorce cabinas.

Cada juego también funciona por su cuenta: abre el `index.html` de su carpeta.

## Las cabinas

| Carpeta | Juego | Género | Controles |
|---|---|---|---|
| `02-game` | Metro Rush | Corredor infinito en 3D | Flechas o deslizar |
| `03-arkanoid` | Arkanoid | Ladrillos | Ratón o flechas |
| `05-tetris` | Bloques de Bolsillo | Puzle | Flechas y espacio |
| `06-snake` | Cable Suelto | Clásico | Flechas o WASD |
| `07-pong` | Duelo de Palas | Deportes, 1 o 2 jugadores | Ratón, flechas y W S |
| `08-invaders` | Lluvia de Marcianos | Disparos | Flechas y espacio |
| `09-vuelo-rasante` | Vuelo Rasante | Reflejos | Espacio o clic |
| `10-simon` | Memoria Neón | Memoria | Clic o Q W A S |
| `11-campo-minado` | Campo Minado | Lógica | Clic y clic derecho |
| `12-fusion` | Fusión 2048 | Puzle | Arrastrar o flechas |
| `13-rompecabezas` | Piezas Sueltas | Destreza | Arrastrar con el ratón |
| `14-asteroides` | Chatarra Espacial | Espacio | Flechas y espacio |
| `15-cruce` | Cruce Peligroso | Travesía | Flechas o WASD |
| `16-cuatro-en-linea` | Cuatro en Línea | Mesa, contra la máquina | Clic o teclas 1 a 7 |

En casi todas, `P` pausa la partida.

## La tienda

`04-arcade-vault` es el catálogo del salón, con el aspecto de una tienda de videojuegos.

- **Filtros por género** y ficha de cada cabina con su carpeta, jugadores y controles.
- **Vista previa**: abre la cabina en una ventana dentro de la tienda, a escala y funcionando de verdad.
- **Hall of Fame**: las cinco mejores marcas de cada juego, firmadas con el nombre que elijas.

Las carátulas no son imágenes. Se generan con degradados de CSS, así que el repositorio no lleva ni un solo archivo de imagen para el catálogo.

## El marcador compartido

`04-arcade-vault/salon.js` es el único archivo común. Las cabinas lo cargan y, al terminar una partida, dejan su resultado:

```js
window.Hall && Hall.registrar('06-snake', score, { unidad: 'pts' });
```

La llamada va con guarda a propósito: si ese archivo faltara, los juegos seguirían funcionando, solo que sin guardar marcas. Todo vive en `localStorage`, que en Chrome se comparte entre las páginas del mismo origen, también abriendo los archivos directamente desde el disco.

Cada juego guarda la medida que le corresponde, y el marcador sabe cuándo lo bueno es un número bajo:

| Medida | Juegos | Mejor es |
|---|---|---|
| Puntos | Arkanoid, Metro Rush, Tetris, Snake, Marcianos, 2048, Asteroides, Cruce | mayor |
| Puertas | Vuelo Rasante | mayor |
| Rondas | Memoria Neón | mayor |
| Peloteo más largo | Duelo de Palas | mayor |
| Segundos | Campo Minado, Piezas Sueltas | menor |
| Fichas para ganar | Cuatro en Línea | menor |

## Desarrollo guiado por specs

`03-arkanoid` sigue un método de trabajo propio: nada se implementa sin una spec aprobada antes. Las specs viven en `03-arkanoid/specs/` y el flujo está documentado en `03-arkanoid/CLAUDE.md`.

## Detalles técnicos

- **Cero dependencias.** Lo único que se descarga son dos tipografías de Google Fonts.
- **Sonido sintetizado.** Los efectos de Arkanoid se generan con `03-arkanoid/scripts/make_sounds.py`, usando numpy y ffmpeg. Los mp3 van en el repositorio, así que no hace falta regenerarlos.
- **Metro Rush** es el juego más grande, con unas tres mil líneas repartidas en siete archivos. Su piel de salón está aislada en `02-game/css/arcade.css`, que se carga después de su hoja propia.
- **Cuatro en Línea** juega con minimax y poda alfa-beta, en tres profundidades.

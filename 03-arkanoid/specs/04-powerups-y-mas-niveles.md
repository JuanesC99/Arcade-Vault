# 04 — Powerups y más niveles

- **Estado:** Implementado
- **Fecha:** 2026-09-09
- **Dependencias:** 01-mvp-arkanoid, 02-animacion-explosion-bloques, 03-sonidos-y-niveles
- **Objetivo:** Añadir cápsulas de powerup que caen de los bloques rotos (multi-bola y vida extra), 5 niveles nuevos hasta un total de 10, y tres efectos de sonido nuevos.

---

## Alcance

### Dentro del spec

- Al destruir un bloque hay una probabilidad de soltar una cápsula que cae hacia abajo.
- La cápsula se activa solo si la paleta la atrapa. Si sale por abajo, se pierde sin penalización.
- Dos powerups: `multiball` (la bola activa se divide en 3) y `extralife` (+1 vida).
- Refactor de la bola única a un array `balls[]`. Se pierde una vida solo cuando cae la última bola.
- 5 niveles nuevos (6 a 10) con patrones propios, siguiendo el estilo generador de `levels.js`.
- La curva de velocidad se extiende: cada nivel sigue sumando 10 % acumulado sobre el anterior.
- El selector de nivel de la pausa pasa de 5 botones en una fila a 10 en dos filas de 5.
- Tres sonidos nuevos: recoger powerup, perder vida y completar nivel.

### Fuera de alcance (para specs futuras)

- Powerups de paleta grande / paleta chica.
- Powerups de bola lenta / bola rápida.
- Bloques resistentes de varios golpes.
- Control de volumen o silencio.
- Persistencia de puntajes.
- Sprites dedicados de cápsula en el spritesheet. Las cápsulas se dibujan con formas de canvas.

---

## Modelo de datos

Cambios sobre el modelo de `01-mvp-arkanoid`.

```js
// Antes: un único objeto ball. Ahora un array.
let balls = [ { x, y, w: 16, h: 16, vx, vy } ];

// Cápsula cayendo
let powerups = [];
// { x, y, w: 24, h: 12, vy: 120, type: 'multiball' | 'extralife' }

const POWERUP_DROP_CHANCE = 0.15;  // probabilidad por bloque destruido
const POWERUP_FALL_SPEED  = 120;   // px/s
const MULTIBALL_SPLIT     = 3;     // bolas resultantes
const MAX_BALLS           = 8;     // tope duro para evitar avalancha
```

Convenciones:

- `multiball` toma la primera bola viva y genera 3 con la misma rapidez, abriendo los ángulos en -20°, 0° y +20°.
- Si ya hay `MAX_BALLS` bolas en juego, `multiball` no añade ninguna y solo suena el efecto.
- El color de la cápsula la identifica: cian para `multiball`, verde para `extralife`.
- Los niveles nuevos usan la misma estructura `{ col, row, color }` que los actuales.

---

## Plan de implementación

1. **Refactor a `balls[]`.** Reemplazar el objeto `ball` por un array de una sola bola en `game.js`. Ajustar `initBall`, `loadLevel`, `update` y `draw` para iterar. Prueba manual: el juego se comporta exactamente igual que antes.
2. **Pérdida de bola con array.** Una bola que sale por abajo se elimina del array. Solo cuando `balls.length === 0` se descuenta una vida y se reinicia una bola. Prueba manual: perder la bola sigue restando una vida.
3. **Caída de cápsulas.** Añadir el array `powerups`, la tirada de `POWERUP_DROP_CHANCE` al romper un bloque, el movimiento de caída, el dibujo como rectángulo redondeado con la letra del tipo, y la eliminación al salir del canvas. Sin efecto al atraparlas todavía. Prueba manual: se ven cápsulas cayendo.
4. **Colisión cápsula-paleta y efectos.** AABB contra la paleta. `extralife` suma una vida. `multiball` divide la bola según el modelo de datos. Prueba manual: atrapar cada tipo produce su efecto.
5. **Niveles 6 a 10.** Añadir los cinco generadores nuevos en `levels.js` y sustituir el `currentLevel < 5` de `game.js` por `LEVELS.length`. Prueba manual: se puede llegar al nivel 10 y ganar.
6. **Selector de pausa a 10 niveles.** Dos filas de 5 botones. Actualizar el hit-testing del click y el dibujo. Prueba manual: los 10 botones cargan su nivel.
7. **Tres sonidos nuevos.** Script `scripts/make_sounds.py` que sintetiza los tres efectos con numpy y los convierte a mp3 con ffmpeg, igual que el enfoque usado en otros proyectos del usuario. Cablearlos en los tres momentos. Prueba manual: cada evento suena.

---

## Criterios de aceptación

- [x] El juego carga sin errores en la consola.
- [x] Romper un bloque suelta una cápsula aproximadamente 15 % de las veces.
- [x] Una cápsula que sale por el borde inferior desaparece y no descuenta vida.
- [x] Atrapar la cápsula verde incrementa el contador de vidas del HUD en exactamente 1.
- [x] Atrapar la cápsula cian deja 3 bolas en pantalla desde 1.
- [x] Con varias bolas en juego, perder una no descuenta vida.
- [x] Perder la última bola descuenta exactamente una vida.
- [x] Nunca hay más de 8 bolas simultáneas.
- [x] `LEVELS` tiene 10 entradas y el nivel 10 tiene velocidad ≈ 2.36× la del nivel 1.
- [x] Completar el nivel 10 muestra el overlay de victoria.
- [x] El overlay de pausa muestra 10 botones en dos filas y cada uno carga su nivel.
- [x] Suena un efecto al recoger powerup, otro al perder vida y otro al completar nivel.

---

## Decisiones

- **Sí:** cápsula que cae y hay que atrapar. Es el estándar de Arkanoid y añade habilidad, frente a aplicar el efecto al instante.
- **Sí:** refactor a `balls[]` antes de tocar nada de powerups. Multi-bola es imposible sobre el modelo de bola única y mezclarlo con la lógica de cápsulas haría el diff ilegible.
- **Sí:** tope de 8 bolas. Sin tope, encadenar cápsulas convierte la pantalla en ruido y el juego deja de ser jugable.
- **No:** paleta grande, paleta chica, bola lenta y bola rápida. Se descartaron en la fase de preguntas para mantener la spec en dos powerups.
- **No:** bloques resistentes de varios golpes. Cambian el modelo de bloque y merecen su propia spec.
- **No:** sprites de cápsula en el spritesheet. El spritesheet actual no los tiene y editarlo abre un frente de assets. Formas de canvas bastan.
- **Sí:** sonidos sintetizados por script en vez de descargados. El proyecto no tiene dependencias externas ni licencias que gestionar.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El refactor a `balls[]` rompe físicas ya funcionando | Es el paso 1 y aislado. Se verifica que el juego se comporta igual antes de seguir. |
| Muchas bolas y muchos `cloneNode().play()` degradan el rendimiento | `MAX_BALLS` acota el número de bolas y por tanto los sonidos por frame. |
| ffmpeg o numpy no disponibles al regenerar sonidos | Ambos están verificados en la máquina. El script queda en `scripts/` y los mp3 se commitean, así que no hace falta regenerarlos. |

---

## Qué NO incluye este spec

- Powerups de paleta y de velocidad de bola.
- Bloques resistentes.
- Control de volumen.
- Persistencia de puntajes.
- Sprites nuevos en el spritesheet.

Cada uno, si llega, va en su propia spec.

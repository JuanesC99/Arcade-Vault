# 03 — Sonidos y niveles

- **Estado:** Implementado
- **Fecha:** 2026-05-08
- **Dependencias:** 01-mvp-arkanoid, 02-animacion-explosion-bloques
- **Objetivo:** Añadir efectos de sonido (rebote y destrucción de bloque) y 5 niveles con patrones de bloques distintos, velocidad de pelota creciente (+10 % por nivel) y selector de nivel accesible desde la pausa (tecla P / Escape).

---

## Alcance

### Dentro del spec

- Reproducir `ball-bounce.mp3` al rebotar la pelota en paredes y paddle
- Reproducir `break-sound.mp3` al destruir un bloque
- Sin control de volumen — siempre activo al volumen por defecto del navegador
- 5 niveles con patrones de bloques distintos y paletas de colores propias
- La velocidad base de la pelota aumenta un 10 % acumulado por nivel
  (nivel 1 = base, nivel 5 ≈ +46 %)
- Al completar todos los bloques de un nivel se avanza al siguiente automáticamente
- Al completar el nivel 5 aparece overlay "¡Completaste el juego!"
- Pausa con tecla P o Escape: overlay semitransparente con botones 1–5
  para saltar directamente a cualquier nivel
- Al saltar a un nivel desde la pausa, la velocidad de la pelota corresponde
  a ese nivel (no siempre arranca desde la base)
- El score acumula a través de los niveles

### Fuera del alcance

- Control de volumen o mute
- Más de 5 niveles
- Power-ups
- Persistencia del progreso entre sesiones
- Música de fondo
- Animación de transición entre niveles
- High scores

---

## Modelo de datos

### Nuevas variables de estado en `game.js`

```js
currentLevel; // number, 1–5, inicia en 1
bounceSound; // HTMLAudioElement — cargado al inicio
breakSound; // HTMLAudioElement — cargado al inicio
```

### Definición de niveles

Array estático `LEVELS` (constante en `levels.js`), un objeto por nivel:

```js
LEVELS = [
  {
    speed: 1.0, // multiplicador de velocidad base (vx/vy × speed)
    blocks: [
      // array de { col, row, color } — solo celdas ocupadas
      { col: 0, row: 0, color: 'red' },
      // ...
    ],
  },
  // niveles 2–5...
];
```

Los 5 patrones:

| Nivel | Patrón             | Descripción                                          |
| ----- | ------------------ | ---------------------------------------------------- |
| 1     | Parrilla completa  | 10×6 relleno (igual al MVP), colores por fila        |
| 2     | Pirámide           | Filas centradas que se estrechan hacia arriba        |
| 3     | Tablero de ajedrez | Bloques en posiciones (col+row) pares                |
| 4     | Filas con huecos   | 6 filas con 3–4 bloques ausentes al azar por fila    |
| 5     | Marco + cruz       | Bloques solo en el borde del área y una cruz central |

Velocidades: nivel 1 = ×1.0, nivel 2 = ×1.1, nivel 3 = ×1.21, nivel 4 = ×1.33, nivel 5 = ×1.46.

### Estado de pausa

```js
isPaused; // boolean, inicia en false
```

---

## Plan de implementación

1. **Cargar sonidos** — al inicio de `game.js`, crear dos `HTMLAudioElement` apuntando a
   `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`, asignarlos a
   `bounceSound` y `breakSound`.

2. **Reproducir sonidos** — en `update(dt)`:

   - Donde la pelota rebota en paredes o paddle: llamar `bounceSound.cloneNode().play()`
   - Donde se marca `block.alive = false`: llamar `breakSound.cloneNode().play()`
   - Usar `cloneNode()` para permitir solapamiento de sonidos simultáneos.

3. **Definir `LEVELS`** — declarar el array estático con los 5 objetos de nivel
   (patrones y multiplicadores de velocidad) en un archivo independiente `levels.js`,
   e incluirlo en `index.html` antes de `game.js`.

4. **Función `loadLevel(n)`** — recibe el número de nivel (1–5), reconstruye el array
   `blocks` según `LEVELS[n-1].blocks`, reposiciona la pelota sobre el paddle,
   aplica `vx * speed` y `vy * speed` usando la velocidad base, y actualiza
   `currentLevel = n`.

5. **Avance automático de nivel** — en `update(dt)`, cuando todos los bloques tienen
   `alive: false`: si `currentLevel < 5` llamar `loadLevel(currentLevel + 1)`;
   si `currentLevel === 5` pasar a `gameState = 'win'` con mensaje
   "¡Completaste el juego!".

6. **Pausa** — añadir listener para teclas P y Escape que alternen `isPaused`.
   En el game loop, si `isPaused === true` saltar el `update(dt)` pero seguir
   llamando `draw()` para renderizar el overlay.

7. **Overlay de pausa** — en `draw()`, cuando `isPaused === true` dibujar sobre el
   canvas: fondo semitransparente, texto "PAUSA" y 5 botones numerados centrados.
   Al hacer clic en un botón: llamar `loadLevel(n)` y desactivar la pausa.

8. **HUD de nivel** — en `draw()`, mostrar el nivel actual junto al score y las vidas
   durante `gameState === 'playing'`.

---

## Criterios de aceptación

- [x] Al rebotar la pelota en una pared o en el paddle suena `ball-bounce.mp3`
- [x] Al destruir un bloque suena `break-sound.mp3` y no suena `ball-bounce.mp3`
- [x] Dos sonidos pueden sonar simultáneamente sin que uno cancele al otro
- [x] El nivel 1 muestra la parrilla completa 10×6
- [x] El nivel 2 muestra un patrón de pirámide centrada
- [x] El nivel 3 muestra un tablero de ajedrez (posiciones pares ocupadas)
- [x] El nivel 4 muestra filas con huecos
- [x] El nivel 5 muestra un marco con cruz central
- [ ] Cada nivel tiene una paleta de colores distinta a los demás
- [ ] Al completar todos los bloques de un nivel, se carga el siguiente automáticamente
- [ ] La pelota es notablemente más rápida en el nivel 5 que en el nivel 1
- [ ] Al completar el nivel 5 aparece el overlay "¡Completaste el juego!"
- [ ] Las teclas P y Escape pausan y reanudan el juego
- [ ] Durante la pausa el juego no avanza (pelota y bloques congelados)
- [ ] El overlay de pausa muestra 5 botones numerados
- [ ] Al pulsar un botón de nivel en la pausa, el juego carga ese nivel con su velocidad correcta
- [ ] El HUD muestra el nivel actual en todo momento durante el juego
- [ ] El score acumula correctamente al pasar de un nivel a otro

---

## Decisiones tomadas y descartadas

| Decisión                     | Elegida                                    | Descartada                        | Motivo                                                        |
| ---------------------------- | ------------------------------------------ | --------------------------------- | ------------------------------------------------------------- |
| Sonidos simultáneos          | `cloneNode().play()`                       | Reusar un solo `Audio` por sonido | Un solo elemento se cancela si el sonido aún no terminó       |
| Control de volumen           | Sin control — volumen por defecto          | Slider o tecla mute               | Fuera del alcance, añade complejidad sin valor claro          |
| Definición de niveles        | Array estático `LEVELS` en `levels.js`     | Archivo JSON externo              | Sin build ni servidor; JSON requeriría fetch asíncrono        |
| Velocidad por nivel          | Multiplicador sobre velocidad base (+10 %) | Velocidad fija distinta por nivel | Más predecible y fácil de ajustar                             |
| Pausa                        | P y Escape alternan `isPaused`             | Solo una tecla                    | Dos teclas cubren convenciones distintas de jugadores         |
| Selector de nivel            | Botones numéricos en overlay de pausa      | Menú principal separado           | Reutiliza el overlay existente; accesible sin salir del juego |
| Velocidad al saltar de nivel | Velocidad del nivel elegido                | Siempre velocidad base            | Coherencia — facilita testear el nivel tal como se jugaría    |
| Transición entre niveles     | Inmediata (carga directa)                  | Animación o pantalla intermedia   | Fuera del alcance; la animación merece su propio spec         |
| Score al cambiar de nivel    | Acumula entre niveles                      | Reinicia por nivel                | Más motivador; consistente con el HUD actual                  |

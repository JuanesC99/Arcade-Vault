# 01 — MVP jugable de Arkanoid

- **Estado:** Implementado
- **Fecha:** 2026-05-07
- **Dependencias:** ninguna (primer spec del proyecto)
- **Objetivo:** Implementar un juego de Arkanoid jugable en una sola pantalla HTML/Canvas de 800×600 px, con paddle, pelota, parrilla de bloques 10×6, 3 vidas, score y overlays de game-over/victoria.

---

## Alcance

### Dentro del MVP

- Canvas 800×600 px, fondo negro
- Paddle controlado con mouse y teclado (←→) simultáneamente
- Pelota con rebote simple (inversión de `vy` en paddle, inversión de `vx`/`vy` en paredes y bloques)
- Parrilla de 10 columnas × 6 filas de bloques, un color por fila
- 3 vidas: al caer la pelota se descuenta una vida y se reposiciona
- Score: 10 puntos por bloque roto, visible en HUD durante el juego
- Overlay semitransparente de "GAME OVER" (0 vidas) y "¡GANASTE!" (todos los bloques rotos)

### Fuera del MVP (dejado para specs posteriores)

- Múltiples niveles
- Power-ups
- High scores / persistencia
- Pantallas separadas de inicio o resultado
- Física de ángulo en el paddle
- Animaciones de explosión al romper bloques
- Audio

---

## Modelo de datos

No se introducen estructuras persistentes. Todo el estado vive en variables de módulo en `game.js`:

### Estado del juego

```js
gameState; // 'playing' | 'gameover' | 'win'
score; // number, inicia en 0
lives; // number, inicia en 3
```

### Paddle

```js
paddle = { x, y, w: 162, h: 14 };
// x se actualiza con mouse y teclado; y fija en 560
```

### Pelota

```js
ball = { x, y, w: 16, h: 16, vx, vy };
// velocidad inicial: vx = 200, vy = -300 (px/s)
// spawna centrada sobre el paddle
```

### Bloques

```js
blocks = [{ x, y, w: 32, h: 16, color, alive: bool }];
// 10 columnas × 6 filas
// colores por fila (de arriba a abajo): red, yellow, cyan, magenta, hotpink, green
// posición inicial: x desde 104, y desde 80, sin gaps entre bloques
```

---

## Plan de implementación

1. **Estructura base** — crear `index.html` con `<canvas id="game" width="800" height="600">`,
   importar `assets/spritesheet.js` y `game.js`. Fondo negro vía CSS.

2. **Game loop** — en `game.js`: llamar `loadSpritesheet()` y arrancar el loop con
   `requestAnimationFrame`; calcular `dt` en segundos entre frames; funciones `update(dt)` y `draw()` vacías.

3. **Paddle** — inicializar `paddle` centrado en x, y=560. Mover con eventos `mousemove`
   (clampear al canvas) y `keydown`/`keyup` (←→ a 400 px/s). Dibujar con `drawSprite('paddle')`.

4. **Pelota** — inicializar `ball` sobre el paddle con `vx=200, vy=-300`.
   En `update`: mover con `dt`, rebotar en paredes (izquierda, derecha, techo),
   rebotar en paddle (invertir `vy`), detectar caída bajo el canvas (perder vida).

5. **Bloques** — generar array `blocks` 10×6 con colores por fila.
   En `update`: para cada bloque `alive`, detectar colisión AABB con la pelota,
   marcar `alive: false`, sumar 10 al score, invertir `vy`.
   En `draw`: dibujar solo los `alive` con `drawSprite('block_' + color)`.

6. **Vidas y game-over** — al perder vida: si `lives > 0` reposicionar pelota sobre paddle;
   si `lives === 0` pasar a `gameState = 'gameover'`. En `draw`: cuando `gameState !== 'playing'`
   dibujar overlay semitransparente con mensaje "GAME OVER" o "¡GANASTE!".

7. **Condición de victoria** — en `update`, tras romper un bloque, comprobar si todos
   los bloques tienen `alive: false`; si es así, `gameState = 'win'`.

8. **HUD** — en `draw`: mostrar score (arriba-izquierda) y vidas restantes (arriba-derecha)
   como texto sobre el canvas durante `gameState === 'playing'`.

---

## Criterios de aceptación

- [x] `index.html` abre en el navegador sin errores en consola
- [x] El canvas mide 800×600 px y tiene fondo negro
- [x] El paddle se mueve con el mouse sin salirse del canvas
- [x] El paddle se mueve con ←→ sin salirse del canvas
- [ ] La pelota arranca moviéndose al cargar la página
- [ ] La pelota rebota en las tres paredes (izquierda, derecha, techo)
- [ ] La pelota rebota en el paddle
- [ ] Se dibujan 60 bloques (10×6) con sus colores por fila
- [ ] Al tocar un bloque, desaparece y el score sube 10 puntos
- [ ] El score se muestra en el HUD durante el juego
- [ ] Las vidas (3) se muestran en el HUD durante el juego
- [ ] Al caer la pelota se pierde una vida y la pelota se reposiciona sobre el paddle
- [ ] Al llegar a 0 vidas aparece overlay "GAME OVER"
- [ ] Al romper todos los bloques aparece overlay "¡GANASTE!"

---

## Decisiones tomadas y descartadas

| Decisión                   | Elegida                       | Descartada                            | Motivo                    |
| -------------------------- | ----------------------------- | ------------------------------------- | ------------------------- |
| Pantallas de resultado     | Overlay semitransparente      | Pantallas separadas                   | Simplicidad de MVP        |
| Física del paddle          | Rebote simple (invertir `vy`) | Ángulo según posición de impacto      | Fuera del alcance del MVP |
| Animación al romper bloque | Ninguna (desaparece)          | Explosión con `EXPLOSION_FRAMES`      | Fuera del alcance del MVP |
| Audio                      | Sin sonido                    | `ball-bounce.mp3` / `break-sound.mp3` | Fuera del alcance del MVP |
| Niveles                    | 1 nivel fijo                  | Múltiples niveles                     | Fuera del alcance del MVP |
| Persistencia               | Ninguna                       | localStorage para high scores         | Fuera del alcance del MVP |

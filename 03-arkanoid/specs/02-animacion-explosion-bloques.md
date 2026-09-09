# 02 — Animación de explosión al romper bloques

- **Estado:** Implementado
- **Fecha:** 2026-05-08
- **Dependencias:** 01-mvp-arkanoid (juego base implementado)
- **Objetivo:** Reproducir la animación de explosión del spritesheet en la posición de cada bloque destruido, mientras el juego continúa sin pausas.

---

## Alcance

### Dentro del spec

- Al destruir un bloque, lanzar una animación de explosión en sus coordenadas
- La animación usa `EXPLOSION_FRAMES[color]` (4 frames) dibujados con `drawFrame()`
  y dura exactamente `EXPLOSION_DURATION` (150 ms)
- Múltiples explosiones corren en paralelo sin límite
- El bloque deja de existir para colisiones en el mismo instante en que se destruye
- La animación se dibuja sobre el espacio vacío donde estaba el bloque

### Fuera del alcance

- Audio (break-sound.mp3, ball-bounce.mp3) — spec separado
- Efectos de partículas adicionales
- Animación en el paddle al rebotar

---

## Modelo de datos

Se añade un array de explosiones activas en `game.js`:

```js
explosions = [
  {
    x, // posición x del bloque destruido
    y, // posición y del bloque destruido
    w, // ancho del bloque (32)
    h, // alto del bloque (16)
    color, // color del bloque — clave en EXPLOSION_FRAMES
    elapsed, // ms transcurridos desde el inicio (inicia en 0)
  },
];
```

Cuando `elapsed >= EXPLOSION_DURATION`, la explosión se elimina del array.
No se persiste ningún dato entre sesiones.

---

## Plan de implementación

1. **Inicializar el array `explosions`** — declarar `let explosions = []` junto al resto
   de variables de estado en `game.js`.

2. **Lanzar explosión al destruir un bloque** — en el punto de colisión donde se marca
   `block.alive = false`, añadir a `explosions` un objeto con `{ x, y, w, h, color, elapsed: 0 }`.

3. **Actualizar explosiones en `update(dt)`** — recorrer `explosions`, incrementar
   `elapsed += dt * 1000` (convertir segundos a ms), eliminar las que superen
   `EXPLOSION_DURATION`.

4. **Dibujar explosiones en `draw()`** — recorrer `explosions`, calcular el índice de frame
   actual con `Math.floor(elapsed / EXPLOSION_DURATION * 4)` (clampear a 3),
   llamar `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`.
   Dibujar después de los bloques y antes del HUD.

---

## Criterios de aceptación

- [x] Al romper un bloque, aparece una animación en su posición antes de desaparecer visualmente
- [x] La animación recorre los 4 frames de `EXPLOSION_FRAMES[color]` en 150 ms
- [x] El color de la explosión corresponde al color del bloque destruido
- [x] El bloque ya no genera colisiones desde el instante en que es destruido
- [ ] Se pueden reproducir múltiples explosiones simultáneas sin que se interfieran
- [x] Al terminar la animación (150 ms), la explosión se elimina del array y deja de dibujarse
- [x] El juego no se pausa ni pierde fluidez durante las explosiones

---

## Decisiones tomadas y descartadas

| Decisión                          | Elegida                                       | Descartada                           | Motivo                               |
| --------------------------------- | --------------------------------------------- | ------------------------------------ | ------------------------------------ |
| Colisión durante animación        | Bloque muere inmediatamente                   | Bloque sólido hasta fin de animación | Evita bugs de pelota atrapada        |
| Límite de explosiones simultáneas | Sin límite                                    | Máximo N animaciones                 | Innecesario — ocurren pocas a la vez |
| Audio al destruir                 | Excluido                                      | `break-sound.mp3`                    | Fuera del alcance, spec separado     |
| Dibujo de frames                  | `drawFrame()` ya disponible en spritesheet.js | Implementación propia                | El asset y la función ya existen     |

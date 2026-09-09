# 05 — Bloques resistentes

- **Estado:** Implementado
- **Fecha:** 2026-09-09
- **Dependencias:** 01-mvp-arkanoid, 02-animacion-explosion-bloques, 03-sonidos-y-niveles, 04-powerups-y-mas-niveles
- **Objetivo:** Añadir bloques que aguantan 2 o 3 golpes, con grietas dibujadas sobre el sprite que muestran el daño acumulado, presentes en los niveles 6 a 10.

---

## Alcance

### Dentro del spec

- El modelo de bloque gana `hits` (golpes restantes) y `maxHits` (dureza original).
- Tres durezas: 1 golpe (el bloque normal de hoy), 2 golpes y 3 golpes.
- Un golpe que no destruye el bloque rebota la pelota, resta un golpe y suma 10 puntos.
- 10 puntos por cada golpe. Un bloque de 3 golpes rinde 30 puntos en total.
- Las grietas se dibujan con trazos de canvas sobre el sprite del bloque, no con sprites nuevos.
- El patrón de grietas es determinista por bloque. No parpadea entre frames.
- Los bloques resistentes se reparten por los niveles 6 a 10. Los niveles 1 a 5 no cambian.
- Solo el golpe que destruye el bloque tira powerup y lanza la animación de explosión.

### Fuera de alcance (para specs futuras)

- Bloques indestructibles.
- Sprites de bloque agrietado en el spritesheet.
- Un sonido propio para el golpe que no destruye. Reutiliza el de rebote.
- Powerups nuevos.
- Bloques que se mueven o que reaparecen.

---

## Modelo de datos

```js
// levels.js — cada entrada de blocks[] acepta hits opcional. Sin él, vale 1.
{ col, row, color, hits }

// game.js — bloque en runtime
{ x, y, w, h, color, hits, maxHits, alive }

const CRACK_COLOR = 'rgba(0, 0, 0, 0.75)';
const CRACK_WIDTH = 2;
```

Convenciones:

- `damage = maxHits - hits`. Con `damage` 0 no se dibuja ninguna grieta.
- Cada grieta es una polilínea de 3 puntos que cruza el bloque.
- Las coordenadas de la grieta se derivan de `x` e `y` del bloque, así que un mismo bloque siempre se agrieta igual.

### Reparto por nivel

| Nivel | Patrón | Bloques de 2 golpes | Bloques de 3 golpes |
|---|---|---|---|
| 6 | Rombo | filas 2 y 3 | ninguno |
| 7 | Tablero | filas 0 y 1 | ninguno |
| 8 | Dos torres | columnas laterales de filas 1 a 5 | la fila 0, que hace de puente |
| 9 | Pirámide invertida | fila 0 | fila 4, la punta |
| 10 | Marco con aspa | el marco | el aspa |

---

## Plan de implementación

1. **Modelo.** `loadLevel` lee `b.hits` con valor por defecto 1 y guarda `hits` y `maxHits`. Sin cambios de comportamiento todavía. Prueba manual: el juego se comporta igual que antes.
2. **Colisión con resta de golpes.** El impacto resta un golpe y suma 10 puntos siempre. Solo destruye, explota y tira powerup cuando `hits` llega a 0. Prueba manual: forzar un bloque a 3 golpes y comprobar que hacen falta tres impactos.
3. **Dibujo de grietas.** Función `drawCracks(block)` llamada desde `draw` cuando `damage > 0`. Prueba manual: un bloque golpeado una vez muestra una grieta.
4. **Reparto por nivel.** Añadir `hits` a los generadores de los niveles 6 a 10 según la tabla. Prueba manual: recorrer los cinco niveles y ver los bloques duros.

---

## Criterios de aceptación

- [x] El juego carga sin errores en la consola.
- [x] Un bloque de 1 golpe se destruye al primer impacto, como antes.
- [x] Un bloque de 2 golpes necesita exactamente 2 impactos.
- [x] Un bloque de 3 golpes necesita exactamente 3 impactos.
- [x] Cada impacto suma exactamente 10 puntos, destruya o no el bloque.
- [x] Un impacto que no destruye rebota la pelota y no lanza explosión ni powerup.
- [x] Un bloque con 1 golpe recibido muestra una grieta, y con 2 muestra dos.
- [x] Las grietas de un mismo bloque no cambian de forma entre frames.
- [x] Los niveles 1 a 5 siguen sin ningún bloque resistente.
- [x] Los niveles 6 a 10 tienen bloques resistentes según la tabla de reparto.

---

## Decisiones

- **Sí:** grietas dibujadas con canvas. El spritesheet no tiene sprites agrietados y editarlo abre un frente de assets que no está en alcance.
- **Sí:** grieta determinista derivada de la posición del bloque. Una grieta aleatoria por frame parpadearía.
- **Sí:** 10 puntos por golpe. Premia el trabajo de romper un bloque duro y mantiene la regla de 10 por impacto de la spec 01.
- **No:** bloques de 4 o más golpes. Con la bola acelerada de los niveles altos alargarían demasiado la partida.
- **No:** sonido propio para el golpe que no destruye. El de rebote ya comunica el impacto y evita generar otro asset.
- **No:** tocar los niveles 1 a 5. Son la curva de aprendizaje del juego.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Las grietas negras se pierden sobre el bloque gris oscuro | El bloque gris usa grieta blanca (`CRACK_COLOR_DARK_BLOCK`). Verificado en el nivel 10. |
| Los niveles duros se hacen largos y aburridos | Los niveles 8 y 10 quedan enteros de bloques resistentes, pero el total de impactos se mantiene acotado: 90 en el nivel 8 y 80 en el nivel 10, frente a los 60 del nivel 1. |

---

## Qué NO incluye este spec

- Bloques indestructibles.
- Sprites nuevos en el spritesheet.
- Sonido propio del golpe no destructivo.
- Powerups nuevos.

Cada uno, si llega, va en su propia spec.

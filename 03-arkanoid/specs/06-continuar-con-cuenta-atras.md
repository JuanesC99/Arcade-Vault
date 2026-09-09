# 06 — Continuar con cuenta atrás

- **Estado:** Implementado
- **Fecha:** 2026-09-09
- **Dependencias:** 01-mvp-arkanoid, 04-powerups-y-mas-niveles, 05-bloques-resistentes
- **Objetivo:** Al quedarse sin vidas, mostrar una cuenta atrás de 10 segundos con un botón SÍ que reinicia la partida, hasta un máximo de tres continues.

---

## Alcance

### Dentro del spec

- Al llegar a 0 vidas se entra en el estado `continue` en vez de ir directo a `gameover`.
- El overlay de `continue` muestra: `GAME OVER`, la pregunta `¿CONTINUAR?`, el número de la cuenta atrás, un botón `SÍ` y los continues restantes.
- La cuenta atrás empieza en 10 y baja de uno en uno, un número por segundo.
- Clic en el botón `SÍ` consume un continue y reinicia la partida: nivel 1, score 0, 3 vidas.
- Máximo 3 continues por partida. Agotados, el estado `gameover` es directo, sin cuenta atrás.
- Si la cuenta atrás llega a 0 se pasa a `gameover`.
- El overlay de `gameover` gana un botón `REINICIAR` que arranca una partida nueva desde el nivel 1 y devuelve los continues a 3.

### Fuera de alcance (para specs futuras)

- Continuar en el nivel alcanzado en vez de reiniciar.
- Continuar con el teclado. Solo se acepta clic en el botón.
- Sonido propio para la cuenta atrás o para el continue.
- Persistencia del récord entre partidas.
- Pantalla de inicio antes de la primera partida.

---

## Modelo de datos

```js
// gameState gana un valor nuevo
gameState // 'playing' | 'paused' | 'continue' | 'gameover' | 'win'

let continuesLeft = 3;   // continues que quedan en la partida
let continueTimer = 0;   // segundos restantes, cuenta atrás en coma flotante

const MAX_CONTINUES = 3;
const CONTINUE_SECONDS = 10;
```

Convenciones:

- El número que se dibuja es `Math.ceil(continueTimer)`. Empieza mostrando 10 y termina en 1 antes de pasar a `gameover`.
- `continueTimer` se descuenta con el mismo `dt` del bucle, no con un `setInterval`.
- La cuenta atrás corre aunque el juego esté en `isPaused`, porque la pausa solo aplica al estado `playing`.

---

## Plan de implementación

1. **Estado y reinicio.** Añadir `continuesLeft`, `continueTimer`, `MAX_CONTINUES`, `CONTINUE_SECONDS` y una función `restartGame()` que pone score 0, 3 vidas, estado `playing` y carga el nivel 1. Prueba manual: llamar `restartGame()` desde la consola reinicia la partida.
2. **Entrada al estado `continue`.** Al agotarse las vidas, si quedan continues se pasa a `continue` con el temporizador a 10. Si no quedan, se pasa a `gameover` como hasta ahora. Prueba manual: perder las vidas entra en `continue`.
3. **Cuenta atrás.** Descontar `continueTimer` en el bucle mientras el estado sea `continue`. Al llegar a 0, pasar a `gameover`. Prueba manual: esperar diez segundos y ver el `GAME OVER`.
4. **Overlay de continue y botón SÍ.** Dibujar el overlay y registrar el clic sobre el botón. El clic consume un continue y llama a `restartGame()`. Prueba manual: continuar arranca el nivel 1 con 3 vidas.
5. **Botón REINICIAR en gameover.** Dibujarlo y cablear su clic a `restartGame()` con los continues de vuelta a 3. Prueba manual: reiniciar desde el game over funciona sin recargar.

---

## Criterios de aceptación

- [x] El juego carga sin errores en la consola.
- [x] Perder la última vida con continues disponibles entra en el estado `continue`, no en `gameover`.
- [x] El overlay de continue muestra 10 al aparecer.
- [x] El número baja de uno en uno y llega a 1 antes de desaparecer.
- [x] Diez segundos sin clic llevan al estado `gameover`.
- [x] Clic en `SÍ` deja el juego en nivel 1, score 0 y 3 vidas.
- [x] Cada continue usado descuenta uno de los tres disponibles y el overlay lo refleja.
- [x] Con 0 continues restantes, perder las vidas va directo a `gameover` sin cuenta atrás.
- [x] El overlay de `gameover` muestra un botón `REINICIAR`.
- [x] Clic en `REINICIAR` deja el juego en nivel 1, score 0, 3 vidas y 3 continues.

---

## Decisiones

- **Sí:** continuar reinicia desde el nivel 1 con todo a cero, según lo pedido.
- **Observación:** con esa regla, el botón `SÍ` y el botón `REINICIAR` hacen lo mismo, y el límite de tres continues funciona como un contador de reinicios. Se implementa así porque es la decisión tomada. Si más adelante se quiere que continuar respete el nivel alcanzado, va en otra spec.
- **Sí:** clic en un botón dibujado en vez de cualquier tecla. Reutiliza el patrón de hit-testing del selector de niveles de la spec 03.
- **Sí:** la cuenta atrás usa el `dt` del bucle. Un `setInterval` viviría fuera del bucle y habría que limpiarlo en cada transición de estado.
- **No:** sonido propio para la cuenta atrás. Habría que generar otro asset y no aporta a la mecánica.
- **No:** continuar con teclado. Se descartó en la fase de preguntas para evitar continues accidentales.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El clic del overlay de pausa y el del overlay de continue se pisan | El manejador de clic ramifica por `gameState` antes de hacer hit-testing. |
| La cuenta atrás sigue corriendo si el jugador cambia de pestaña | `requestAnimationFrame` se congela en pestañas ocultas, así que el temporizador se pausa solo. |

---

## Qué NO incluye este spec

- Continuar en el nivel alcanzado.
- Continuar con teclado.
- Sonidos nuevos.
- Récords persistentes.
- Pantalla de inicio.

Cada uno, si llega, va en su propia spec.

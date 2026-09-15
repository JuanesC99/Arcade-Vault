# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Juego de Arkanoid en HTML, CSS y JavaScript puro — sin dependencias, cero frameworks. Se abre directamente en el navegador (`open index.html`).

## Desarrollo

No hay paso de build ni servidor requerido. Para probar cambios: `open index.html`.

## Arquitectura

### Archivos principales

| Archivo | Rol |
|---|---|
| `index.html` | Punto de entrada; panel lateral del salón, scripts y el `<canvas>` de 800×600 px |
| `game.js` | Toda la lógica del juego (estado, loop, físicas, render, panel, overlays) |
| `levels.js` | Define `LEVELS`: array de 10 niveles con `blocks[]` y `speed` |
| `assets/spritesheet.js` | Carga el spritesheet y expone helpers de dibujo |
| `scripts/make_sounds.py` | Sintetiza los efectos de sonido de la spec 04 (numpy + ffmpeg) |

### Assets

- **`assets/spritesheet-breakout.png`** — spritesheet único con todos los sprites
- **`assets/sounds/ball-bounce.mp3`** y **`assets/sounds/break-sound.mp3`** — rebote y ruptura de bloque
- **`assets/sounds/powerup.mp3`**, **`life-lost.mp3`** y **`level-complete.mp3`** — generados por `scripts/make_sounds.py`

### API de `spritesheet.js`

```js
loadSpritesheet(cb)                        // carga la imagen; llama cb al terminar
drawSprite(ctx, name, x, y, w, h)          // dibuja un sprite por nombre
drawFrame(ctx, frame, x, y, w, h)          // dibuja un frame de animación
// Constantes exportadas: SPRITES, EXPLOSION_FRAMES, EXPLOSION_DURATION
```

### Sprites disponibles

| Nombre | Descripción |
|---|---|
| `paddle` | Paleta (162×14 px) |
| `ball` | Pelota (16×16 px) |
| `block_gray`, `block_red`, `block_yellow`, `block_cyan`, `block_magenta`, `block_hotpink`, `block_green` | Bloques por color |

Las explosiones usan `EXPLOSION_FRAMES[color]` (4 frames) y duran `EXPLOSION_DURATION` ms.

### Estado del juego (en `game.js`)

```js
gameState   // 'playing' | 'paused' | 'continue' | 'gameover' | 'win'
score       // number
lives       // number (inicia en 3)
continuesLeft // continues restantes de la partida (inicia en 3)
continueTimer // segundos que quedan de la cuenta atrás de continuar
currentLevel // número de nivel activo (0-indexed sobre LEVELS)
paddle      // { x, y, w: 162, h: 14 }
balls[]     // [{ x, y, w: 16, h: 16, vx, vy }] — varias bolas a la vez con multiball
powerups[]  // [{ x, y, w, h, vy, type: 'multiball' | 'extralife' }] — cápsulas cayendo
blocks[]    // [{ x, y, w, h, color, hits, maxHits, alive }] — hits 1, 2 o 3 golpes
explosions[]// animaciones activas
```

## Flujo de trabajo spec-driven

Este proyecto usa desarrollo guiado por specs. **No escribir código sin spec aprobada.**

### Comandos

| Comando | Acción |
|---|---|
| `/spec [descripción]` | Diseña una spec nueva haciendo preguntas primero. Guarda en `specs/NN-slug.md` con estado `Draft`. |
| `/spec-impl NN-slug` | Implementa la spec aprobada paso a paso, creando rama `spec-NN-slug` y pausando tras cada paso. |

### Ciclo de vida de una spec

```
Draft → Approved → Implementado
               ↘ Obsoleto
```

El estado se cambia **manualmente** antes de ejecutar `/spec-impl`. Nunca implementar una spec en estado `Draft`.

### Estructura de una spec (`specs/NN-slug.md`)

```markdown
# NN — Título breve

- **Estado:** Draft | Approved | Implementado | Obsoleto
- **Fecha:** YYYY-MM-DD
- **Dependencias:** specs previas requeridas
- **Objetivo:** una sola frase

## Alcance
## Modelo de datos
## Plan de implementación   ← pasos numerados, cada uno commiteable
## Criterios de aceptación  ← checklist booleano
## Decisiones               ← qué se consideró y por qué
## Qué NO incluye este spec
```

La referencia completa está en `.agents/skills/spec/template.md`.

### Specs existentes

| # | Slug | Estado |
|---|---|---|
| 01 | `mvp-arkanoid` | Implementado |
| 02 | `animacion-explosion-bloques` | Implementado |
| 03 | `sonidos-y-niveles` | Implementado |
| 04 | `powerups-y-mas-niveles` | Implementado |
| 05 | `bloques-resistentes` | Implementado |
| 06 | `continuar-con-cuenta-atras` | Implementado |
| 07 | `panel-de-salon` | Implementado |

El próximo spec será `08-...`.

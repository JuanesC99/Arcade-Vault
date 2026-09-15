# 07 — Panel de salón

- **Estado:** Implementado
- **Fecha:** 2026-09-10
- **Dependencias:** 01-mvp-arkanoid, 06-continuar-con-cuenta-atras
- **Objetivo:** dar a la cabina el mismo panel lateral y la misma paleta que el resto del Arcade Vault.

## Alcance

Arkanoid era la única cabina del salón servida como un `<canvas>` pelado sobre
fondo gris: sin título, sin panel, sin enlace de vuelta y con el marcador
dibujado dentro del lienzo. Esta spec la pone en línea con las demás.

Entra:

- El esqueleto compartido en `index.html`: fuentes Press Start 2P y Chakra
  Petch, variables de color del salón, `h1`, `.stage` alrededor del lienzo,
  `.side` con recuadros y `.back` de vuelta al salón.
- Cinco recuadros de estado: puntos, récord, nivel, vidas y continues; más dos
  de texto con controles y reglas.
- El marcador sale del lienzo y pasa al panel.

No entra: la lógica del juego, los niveles, los sonidos ni los overlays de
pausa, continuar y game over, que siguen dibujándose en el lienzo.

## Modelo de datos

Sin cambios de estado. Se añade `best`, el récord de la sesión en memoria,
igual que en las demás cabinas.

## Plan de implementación

1. Reescribir `index.html` con el esqueleto y el panel.
2. En `game.js`, leer los cinco recuadros y añadir `pintarHud`, que solo
   escribe en el DOM cuando el número cambió; llamarla desde el bucle.
3. Quitar del `draw` el bloque que pintaba puntos, nivel y vidas en el lienzo.

## Criterios de aceptación

- [x] La cabina se ve con la paleta y el panel del resto del salón.
- [x] Puntos, récord, nivel, vidas y continues se actualizan durante la partida.
- [x] El lienzo ya no dibuja el marcador.
- [x] El enlace de vuelta al salón está donde en las demás cabinas.
- [x] La página suelta sigue funcionando abriendo `index.html`.

## Decisiones

- **El panel repinta desde el bucle, no desde cada suceso.** Puntos, vidas y
  continues cambian en sitios repartidos por `update`; llamar a `pintarHud`
  una vez por cuadro y comparar contra el último valor escrito sale más
  barato de mantener que apuntar cada punto de cambio.
- **El récord no se guarda.** Las demás cabinas tampoco lo persisten: el
  registro que dura es el del salón, por `Hall.registrar`.

## Qué NO incluye este spec

La pantalla de encendido de la cabina, que vive en la aplicación de Next.js y
es común a las diecisiete, no en este juego.

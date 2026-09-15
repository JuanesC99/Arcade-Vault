# Arcade Vault · versión Next.js + Nest.js

El mismo salón de siempre, con las mismas dieciocho cabinas, servido ahora
como aplicación. Dos piezas:

```
20-arcade-vault-app/
  web/          salón y cabinas · Next.js 16 · React 19 · TypeScript
  api/          marcador y cuentas · Nest.js 12 · Prisma · SQLite
  herramientas/ los conversores que trajeron las cabinas hasta aquí
```

Las carpetas `02-game`, `03-arkanoid`, `05-tetris`… siguen en su sitio y
siguen funcionando abriendo su `index.html`. Esta aplicación no las sustituye
ni las toca: las lee.

## Arrancar

```bash
npm run instalar        # dependencias de las dos partes
npm run preparar-bd     # crea api/prisma/dev.db con su primera migración
npm run dev             # api en :3001 y salón en :3000
```

Y abrir <http://localhost:3000>. Sin la API el salón funciona igual, pero las
partidas se quedan en el navegador y el salón de la fama sale vacío.

Para producción, `npm run build` y luego `npm start`.

## Cómo se migraron los juegos

Un juego es un bucle de canvas imperativo: dentro de React vive igual, así que
**la lógica no se reescribió, se envolvió**. De cada `index.html` original
salen tres piezas, generadas por `herramientas/convertir-cabinas.mjs`:

| pieza | qué es |
| --- | --- |
| `estilos.css` | el `<style>` y las hojas propias, tal cual |
| `marcado.tsx` | el panel y el lienzo, pasados a JSX con los mismos identificadores |
| `motor.js` | el JavaScript del juego, dentro de `iniciar(entorno)` |

El truco está en el entorno (`web/src/lib/entorno.ts`). El motor empieza así:

```js
export function iniciar(entorno) {
  const { document, window, requestAnimationFrame, setTimeout, ... } = entorno;
  // ...el código original, sin tocar
}
```

Al desestructurar, esos nombres tapan a los globales dentro de la función. El
entorno devuelve versiones vigiladas: apunta cada escucha, cada reloj, cada
cuadro de animación y cada nodo que la cabina se fabrica, de modo que
`limpiar()` lo deshace todo cuando React desmonta el juego. Sin eso, entrar y
salir de una cabina dejaría bucles corriendo de fondo.

El mismo entorno resuelve un detalle fino: varias cabinas arrancaban con
`window.addEventListener('load', ...)`, un evento que ya pasó cuando el
componente se monta. El entorno detecta ese caso y las avisa igualmente.

Los acompañantes del salón (pantalla completa, mando táctil y sonido) están
portados con la misma técnica en `web/src/extras/`, por
`herramientas/portar-extras.mjs`.

### Volver a convertir

Si tocas un juego en su carpeta original:

```bash
npm run convertir-cabinas            # las dieciocho
npm run convertir-cabinas 06-snake   # solo una
```

## La pantalla de encendido

Ninguna cabina arranca sola. Al entrar, `web/src/componentes/Arranque.tsx`
tapa el marco con la pantalla de encendido: el nombre del juego, una
comprobación de arranque que se escribe sola, el género, los jugadores, los
controles, el crédito con el alias de quien juega y un `PULSA START` que
responde a cualquier tecla o a un clic.

Mientras esa pantalla está puesta **el motor no corre**: `Cabina` retrasa la
llamada a `iniciar` hasta que alguien pulsa start, así que el jugador lee los
controles con la cabina quieta. Está en el marco compartido, de modo que la
tienen las dieciocho sin que ningún juego sepa de ella.

## El marcador

Los juegos siguen llamando igual que cuando eran páginas sueltas:

```js
window.Hall && Hall.registrar('06-snake', score, { unidad: 'pts' });
```

Lo que cambia es quién escucha. `web/src/lib/marcador.ts` instala ese `Hall`
mientras la cabina está montada: con sesión abierta la partida sube a la API;
sin ella se queda en `localStorage` y se ve aparte en el salón de la fama.

### API

| método | ruta | quién |
| --- | --- | --- |
| GET | `/api/salud` | cualquiera |
| POST | `/api/auth/registro` | cualquiera |
| POST | `/api/auth/acceso` | cualquiera |
| GET | `/api/auth/yo` | con token |
| PATCH | `/api/auth/alias` | con token |
| PATCH | `/api/auth/clave` | con token |
| DELETE | `/api/auth/cuenta` | con token |
| GET | `/api/marcas/hall` | cualquiera |
| GET | `/api/marcas/mias` | con token |
| POST | `/api/marcas` | con token |

Las contraseñas se guardan con bcrypt (12 vueltas) y la sesión viaja en un
token JWT que el navegador guarda en `localStorage`. El acceso compara el hash
aunque el usuario no exista, para no delatar qué cuentas hay.

**Esto no es un servicio para exponer a internet.** El secreto de firma viene
en `api/.env` con un valor de ejemplo, la base es un archivo SQLite y no hay
límite de intentos ni recuperación de contraseña. Vale para jugar en tu equipo
o en tu red; para cualquier otra cosa habría que endurecerlo primero.

## Configuración

| archivo | para qué |
| --- | --- |
| `api/.env` | `DATABASE_URL`, `JWT_SECRETO`, `PORT`, `ORIGENES` |
| `web/.env.local` | `NEXT_PUBLIC_API`, dónde escucha el marcador |

Los dos tienen su `.env.ejemplo` al lado.

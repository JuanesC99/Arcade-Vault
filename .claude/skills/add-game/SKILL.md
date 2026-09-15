---
name: add-game
description: Añade una cabina nueva al Arcade Vault de principio a fin — el juego en su carpeta NN-slug con HTML, CSS y JS puros, su ficha en la tienda 04-arcade-vault, su conversión a la app Next.js de 20-arcade-vault-app y la documentación. Úsala cuando pidan "añade un juego", "nueva cabina", "crea un juego de X para el salón", "add game" o /add-game.
argument-hint: "[idea del juego, p. ej. 'pac-man', 'breakout de golf', 'carreras vista cenital']"
---

# add-game — nueva cabina para el Arcade Vault

Una cabina no está terminada hasta que aparece en **los tres sitios**: su página suelta, la tienda de HTML plano y la app de Next.js. Justo eso falló una vez con `35-fontanero`: llegó a la app sin pasar por `04-arcade-vault`. Sigue la lista completa y no te saltes pasos.

Todas las rutas son relativas a la raíz del repo (`01-firstcode/`). Todo el texto visible del juego va en **español**.

---

## 0. Antes de escribir código

1. **Lee lo que ya hay.** Consulta `README.md` y la lista `JUEGOS` de `04-arcade-vault/index.html` para no repetir un género o un juego que ya existe.
2. **Pregunta solo lo que falte** (una sola ronda de `AskUserQuestion`, como mucho):
   - qué juego es y qué clásico lo inspira;
   - uno o dos jugadores;
   - si lleva sonido o melodía.
   Si el usuario ya lo dijo, no preguntes: decide tú y cuéntalo.
3. **Nombre propio, nunca la marca.** El salón reinventa los clásicos con nombres en español: Tetris → *Bloques de Bolsillo*, Snake → *Cable Suelto*, Mario → *Mundo Fontanero*. No uses nombres, personajes ni logotipos registrados.
4. **Carpeta.** `NN-slug` en minúsculas, con guiones y sin tildes. `NN` es el número siguiente al más alto que exista (hoy `35-fontanero`, así que toca `36-`), salvo que el usuario pida otro. **El nombre de la carpeta es el id del juego en todas partes**: `Hall.registrar`, `catalogo.ts`, `registro.tsx` y la tabla `marcas` de la API.

---

## 1. La cabina: `NN-slug/index.html`

Parte de `plantilla.html`, que está junto a este archivo. Es el esqueleto común con la paleta, el panel, la superposición y el orden de los scripts. Cópiala y rellénala.

### Reglas del esqueleto (no negociables)

| Pieza | Por qué |
|---|---|
| `:root` con `--void --panel --edge --ink --dim --neon --volt --amber --pixel --body` | Es la paleta del salón. No inventes colores de fondo nuevos. |
| Fuentes Press Start 2P + Chakra Petch desde Google Fonts | El conversor las cambia por `var(--pixel-fuente)` y `var(--body-fuente)`. |
| `body::before` con las líneas de barrido | Da la estética CRT común. |
| `<h1>` + `.stage` envolviendo el `<canvas>` y el `.overlay` | `pantalla.js` busca `.stage` para escalarlo. |
| `.side` con varias `.box` y el enlace `a.back` al final | `pantalla.js` y `sonido.js` cuelgan sus botones antes de `.back`. El conversor reescribe su `href`. |
| Cajas de marcador: `.box` con `h2` + `.val` | En el móvil se ven en dos columnas. |
| CONTROLES y REGLAS: `.box ancho solo-texto` | `movil.js` las oculta cuando aparece el mando. |
| Favicon con un emoji en `data:image/svg+xml` | Todas las cabinas lo llevan. |
| Sin imágenes para la interfaz | Todo se dibuja en canvas o con CSS. Solo se permite material propio en `NN-slug/assets/`. |

### Orden de los scripts, al final de `<body>`

```html
<script src="../04-arcade-vault/cuentas.js"></script>
<script src="../04-arcade-vault/salon.js"></script>
<script src="../04-arcade-vault/pantalla.js"></script>
<script src="../04-arcade-vault/sonido.js"></script>   <!-- solo si suena -->
<script>window.MANDO = { ... };</script>               <!-- en su propio <script>, en una línea -->
<script src="../04-arcade-vault/movil.js"></script>
<script>
  // todo el juego aquí
</script>
```

### Reglas del código del juego

Estas reglas existen para que `convertir-cabinas.mjs` lo porte sin tocarlo:

- **JavaScript en línea**, o en archivos propios con rutas relativas (`js/juego.js`). Nada de módulos ES, `import` ni dependencias.
- **Nada de manejadores en el HTML** (`onclick="..."`). JSX no los admite. Usa siempre `addEventListener`.
- **No uses `document.write`, `return` en el nivel superior ni `var` globales que otras páginas lean.** El motor acaba dentro de `function iniciar(entorno)`.
- Arranca con `requestAnimationFrame` directamente o con `window.addEventListener('load', ...)`. El entorno contempla los dos casos.
- El material propio se pide con rutas que empiecen por `'assets/...'`. El conversor las reescribe a `/juegos/NN-slug/assets/`.
- Evita llaves `{ }` sueltas en el texto del HTML. Se escapan, pero ensucian el JSX.
- **Todo llama con guarda**, para que la página funcione aunque falte un archivo común:
  ```js
  window.Hall && Hall.registrar('NN-slug', valor, { unidad: 'pts', etiqueta: 'nivel 3' });
  const sfx = n => window.Sonido && Sonido.efecto(n);
  ```

### Bucle y estados

Sigue el patrón de `06-snake/index.html`:

- `estado`: `'menu' | 'jugando' | 'pausa' | 'fin'`;
- un bucle `requestAnimationFrame` que suma `dt` y avanza la lógica a paso fijo;
- `dibujar()` en cada cuadro;
- `pintarHud()` escribe en las `.val` del panel;
- una superposición `#over` con `#overTitle`, `#overText` y `#overBtn` para empezar, pausar y terminar.

Teclas del salón:
- `P` pausa, en todas las que tengan acción continua;
- `F` pantalla completa, que ya pone `pantalla.js`;
- `M` silencio, que ya pone `sonido.js`.

No las reutilices para otra cosa.

### Marcador (`Hall.registrar`)

Llámalo **una vez** al terminar la partida. Elige la medida que de verdad cuenta:

| Tipo de juego | `unidad` | `menorEsMejor` |
|---|---|---|
| Puntuación | `'pts'` | no |
| Supervivencia o distancia | `'puertas'`, `'metros'`, `'rondas'` | no |
| Contrarreloj o puzle resuelto | `'s'` | **`true`** |
| Ganar con menos recursos | `'fichas'`, `'movimientos'` | **`true`** |

`etiqueta` es texto corto de contexto: `'oleada 4'`, `'5×5'`, `'rival 2'`.

### Mando táctil (`window.MANDO`)

Los botones del mando disparan **las mismas teclas** que ya escucha el juego. No se escribe lógica táctil aparte.

| Si el juego usa… | `MANDO` |
|---|---|
| Cuatro direcciones | `{ cruceta:'cuatro', acciones:[{k:' ',txt:'FUEGO'},{k:'p',txt:'PAUSA'}] }` |
| Solo izquierda y derecha | `{ cruceta:'horizontal', acciones:[...] }` |
| Piezas que caen | `{ cruceta:'tetris', acciones:[{k:' ',txt:'SOLTAR'},{k:'p',txt:'PAUSA'}] }` |
| Girar y empujar | `{ cruceta:'nave', acciones:[...] }` |
| Seguir el ratón | `{ arrastre:true, acciones:[{k:'p',txt:'PAUSA'}] }` |
| Un clic o toque en el lienzo | `{ toque:true, acciones:[{k:' ',txt:'IMPULSO'}] }` |
| Clic derecho | `{ alterno:{ txt:'BANDERA', selector:'#tablero', evento:'contextmenu' } }` |
| Ya se toca directamente | `{ }` |

`k` es el `e.key` exacto (`' '`, `'z'`, `'p'`). `txt` va en mayúsculas y tiene como mucho 8 caracteres.

### Sonido (opcional)

`04-arcade-vault/sonido.js` sintetiza todo, sin archivos de audio.

- **Efectos que ya existen:** `disparo explosion ladrillo metal premio vida muerte nivel salto saltoPared espada corte ninpo dano swing impacto bloqueo esquiva estrella campana cuenta caida aviso`.
- **Melodías:** `tanques sombra combate fontanero`. Se arrancan con `Sonido.melodia('nombre')` y se paran con `Sonido.melodia(null)`.
- **Un efecto o una melodía nuevos** se añaden a los objetos de `sonido.js`, siguiendo el formato de los que ya hay. Después ejecuta `npm run portar-extras` en `20-arcade-vault-app` para copiarlos a `web/src/extras/sonido.js`.
- Si un juego se hace sonar solo con osciladores propios, pierde el silencio común con `M`. No lo hagas: usa `Sonido`.

---

## 2. La tienda de HTML plano: `04-arcade-vault/index.html`

1. **Portada.** Añade `.aNN` después de la última clase `.aN` del `<style>` (hoy la última es `.a18` en los dos sitios). Usa **solo degradados CSS** que evoquen el juego con la paleta del salón. Usa el mismo número `aNN` que en la app, para que coincidan.
2. **Ficha.** Añade una entrada al final del array `JUEGOS`:
   ```js
   {
     t:'Título', g:'género', a:'aNN',
     url:'../NN-slug/index.html', carpeta:'NN-slug',
     jugadores:'1 jugador', controles:'Flechas y espacio',
     tags:['Género','Rasgo','Rasgo','Rasgo'],
     d:'Dos frases que cuenten la mecánica que lo hace distinto, no un eslogan.'
   },
   ```
   `g` va en minúsculas. Reutiliza un género que ya exista si encaja (`plataformas`, `puzle`, `disparos`…), porque los filtros salen de ahí. El texto de `d` usa el mismo tono que las demás fichas.
3. **Recuento.** Actualiza el número de cabinas en el texto «Arcade Vault reúne *dieciocho* cabinas…» y en la `<meta name="description">` del `index.html` raíz.

---

## 3. La app: `20-arcade-vault-app/`

1. **Conversor.** Añade `'NN-slug'` al final del array `TODAS` en `herramientas/convertir-cabinas.mjs`.
2. **Conversión:**
   ```bash
   cd 20-arcade-vault-app && npm run convertir-cabinas NN-slug
   ```
   Esto genera `web/src/juegos/NN-slug/{estilos.css,marcado.tsx,motor.js,index.tsx}` y reescribe `registro.tsx`. **No edites a mano los archivos generados.** Si algo sale mal, corrige el `index.html` original y vuelve a convertir.
3. **Catálogo.** Añade la entrada a `CABINAS` en `web/src/lib/catalogo.ts`. Son los mismos datos que en la tienda, con otros nombres: `titulo genero arte carpeta jugadores controles etiquetas descripcion`.
4. **Portada.** Añade la misma `.aNN` en `web/src/estilos/salon.css`, después de la última.
5. **API.** No hace falta tocarla: `Marca.juego` acepta cualquier id de carpeta.

---

## 4. Documentación

- `README.md` de la raíz:
  - añade la fila a la tabla «Las cabinas»;
  - añade la cabina a la tabla de mandos y a la de medidas del marcador;
  - si suena, añádela a la tabla de sonido;
  - actualiza «dieciocho» (o el número que toque) en todo el texto;
  - si el juego tiene alguna idea técnica curiosa, añade una línea en «Detalles técnicos».
- `20-arcade-vault-app/README.md`: actualiza el recuento de cabinas.
- También dicen «dieciocho» los comentarios de `convertir-cabinas.mjs` y de `registro.tsx`. Actualízalos si cambias el recuento.

---

## 5. Verificación (obligatoria antes de dar la cabina por buena)

Comprueba el juego tú mismo, no se lo pidas al usuario. Usa la skill `browser-automation`, o Chrome si está conectado:

1. **Página suelta.** Abre `NN-slug/index.html`. Comprueba que no hay errores en consola, que se ve el panel y que la partida se puede empezar, pausar con `P`, perder y reiniciar.
2. **Marcador.** Al terminar, `localStorage['arcadeVault:hof:v1']` contiene `NN-slug` con la unidad correcta.
3. **Tienda.** Abre `04-arcade-vault/index.html`. Comprueba que la tarjeta tiene portada, que el filtro de género la muestra, que la vista previa carga y que el Hall of Fame la lista.
4. **Móvil.** Con una ventana de unos 400 px de ancho, el mando aparece y sus botones mueven el juego.
5. **App**, si el entorno lo permite:
   - `npm run dev` en `20-arcade-vault-app`;
   - abre `http://localhost:3000/juegos/NN-slug`;
   - pasa la pantalla de encendido, juega y sal de la cabina;
   - al salir no deben quedar bucles corriendo (la consola queda limpia);
   - `npx tsc --noEmit` en `web/` no da errores.

Informa de lo que funcionó y de lo que no pudiste comprobar. **No hagas commit** salvo que te lo pidan. Si te lo piden, usa un solo commit con el formato del historial: `Nombre del Juego: una frase con la mecánica`.

---

## Lista rápida

- [ ] `NN-slug/index.html` a partir de la plantilla, con los scripts en orden
- [ ] `Hall.registrar('NN-slug', …)` con la unidad y `menorEsMejor` correctos
- [ ] `window.MANDO` probado en el móvil
- [ ] `.aNN` y la entrada en `JUEGOS` de `04-arcade-vault/index.html`
- [ ] `TODAS` en `convertir-cabinas.mjs` + `npm run convertir-cabinas NN-slug`
- [ ] Entrada en `catalogo.ts` + `.aNN` en `salon.css`
- [ ] Tablas del README y recuento de cabinas en todos los sitios
- [ ] Verificado en el navegador, sin errores de consola

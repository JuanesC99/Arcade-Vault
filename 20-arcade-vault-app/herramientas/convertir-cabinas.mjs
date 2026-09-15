/**
 * Convierte las cabinas de HTML plano en piezas de la aplicación React.
 *
 *   node herramientas/convertir-cabinas.mjs [carpeta...]
 *
 * De cada `<carpeta>/index.html` salen tres archivos en
 * `web/src/juegos/<carpeta>/`:
 *
 *   estilos.css   el <style> tal cual, sin tocar una coma
 *   marcado.tsx   el cuerpo de la página, pasado a JSX
 *   motor.js      el <script> del juego, envuelto en iniciar(entorno)
 *
 * La lógica de los juegos no se reescribe: se envuelve. Por eso el motor
 * sigue siendo JavaScript y recibe del entorno un `document`, un `window`,
 * los relojes y los cuadros de animación vigilados, que dentro de la función
 * tapan a los globales y permiten desmontar la cabina sin dejar rastro.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');
const DESTINO = resolve(AQUI, '..', 'web', 'src', 'juegos');

/** Etiquetas que en JSX tienen que cerrarse solas. */
const VACIAS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area']);

/** Atributos que cambian de nombre al pasar a JSX. */
const RENOMBRES = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  minlength: 'minLength',
  spellcheck: 'spellCheck',
  autocomplete: 'autoComplete',
  readonly: 'readOnly',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  contenteditable: 'contentEditable',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
};

function aCamello(propiedad) {
  return propiedad.replace(/-([a-z])/g, (_, letra) => letra.toUpperCase());
}

/** `style="a:b;c:d"` pasa a un objeto de JSX. */
function estiloAObjeto(texto) {
  const pares = texto
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((par) => {
      const corte = par.indexOf(':');
      const propiedad = par.slice(0, corte).trim();
      const valor = par.slice(corte + 1).trim();
      return `${JSON.stringify(aCamello(propiedad))}: ${JSON.stringify(valor)}`;
    });
  return `{{ ${pares.join(', ')} }}`;
}

function convertirAtributos(crudo) {
  // atributo="valor", atributo='valor' o atributo suelto
  return crudo.replace(
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*("([^"]*)"|'([^']*)'))?/g,
    (entero, nombre, tieneValor, _comillas, dobles, simples) => {
      const valor = dobles ?? simples;
      const bajo = nombre.toLowerCase();

      if (!tieneValor) return `${RENOMBRES[bajo] ?? bajo}={true}`;
      if (bajo === 'style') return `style=${estiloAObjeto(valor)}`;

      const nuevo = RENOMBRES[bajo] ?? (bajo.startsWith('data-') || bajo.startsWith('aria-') ? bajo : nombre);
      return `${nuevo}=${JSON.stringify(valor)}`;
    },
  );
}

function htmlAJsx(html) {
  let jsx = html;

  // Las llaves sueltas del texto romperían el JSX, así que se escapan antes
  // de introducir ninguna llave propia de JSX.
  jsx = jsx.replace(/[{}]/g, (llave) => `{'${llave}'}`);

  // comentarios de HTML a comentarios de JSX
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, (_, dentro) => `{/*${dentro.replace(/\*\//g, '* /')}*/}`);

  // etiquetas de apertura y cierre
  jsx = jsx.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*?)?)(\/?)>/g, (entero, etiqueta, atributos, cierra) => {
    const nombre = etiqueta.toLowerCase();
    const convertidos = atributos.trim() ? ' ' + convertirAtributos(atributos.trim()) : '';
    if (VACIAS.has(nombre) || cierra) return `<${nombre}${convertidos} />`;
    return `<${nombre}${convertidos}>`;
  });

  return jsx;
}

function sangrar(texto, espacios) {
  const relleno = ' '.repeat(espacios);
  return texto
    .split('\n')
    .map((linea) => (linea.trim() ? relleno + linea : ''))
    .join('\n');
}

function convertir(carpeta) {
  const origen = join(RAIZ, carpeta, 'index.html');
  if (!existsSync(origen)) {
    console.log(`  · ${carpeta}: no existe ${origen}`);
    return false;
  }

  const html = readFileSync(origen, 'utf8');
  const salida = join(DESTINO, carpeta);
  mkdirSync(salida, { recursive: true });

  /** Rutas propias de la cabina, no las del salón compartido. */
  const esPropia = (ruta) => !!ruta && !ruta.startsWith('..') && !ruta.startsWith('http');

  // ---- estilos: el <style> de la página más las hojas propias que enlace ----
  const trozosCss = [];
  for (const [, href] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
    if (!esPropia(href)) continue;
    const hoja = join(RAIZ, carpeta, href);
    if (existsSync(hoja)) trozosCss.push(`/* ${href} */\n` + readFileSync(hoja, 'utf8').trim());
  }
  const estilo = html.match(/<style>([\s\S]*?)<\/style>/);
  if (estilo) trozosCss.push('/* <style> de index.html */\n' + estilo[1].trim());

  // Las fuentes ya no se piden a Google desde el CSS: las sirve next/font
  // desde el layout raíz y llegan aquí como variables.
  for (let i = 0; i < trozosCss.length; i++) {
    trozosCss[i] = trozosCss[i]
      .replace(/@import\s+url\([^)]*\);?\s*/g, '')
      .replace(/'Press Start 2P'/g, 'var(--pixel-fuente)')
      .replace(/'Chakra Petch'/g, 'var(--body-fuente)');
  }

  writeFileSync(
    join(salida, 'estilos.css'),
    `/* Estilos de la cabina ${carpeta}, tal cual venían de su página suelta.\n` +
      `   Next solo los carga en la ruta de este juego, así que no se pisan\n` +
      `   con los de las demás cabinas ni con los del salón. */\n\n` +
      trozosCss.join('\n\n') +
      '\n',
    'utf8',
  );

  // ---- material que el juego carga en marcha (imágenes, sonidos) ----
  const material = join(RAIZ, carpeta, 'assets');
  if (existsSync(material)) {
    cpSync(material, resolve(AQUI, '..', 'web', 'public', 'juegos', carpeta, 'assets'), {
      recursive: true,
    });
  }

  // ---- cuerpo ----
  const cuerpo = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (!cuerpo) throw new Error(`${carpeta}: no encuentro el <body>`);

  let marcado = cuerpo[1];
  const guiones = [];

  // Un juego puede traer su lógica en línea o repartida en archivos sueltos;
  // los recorremos en el mismo orden en el que los cargaba la página.
  const tragarArchivo = (src) => {
    if (!esPropia(src)) return;
    const archivo = join(RAIZ, carpeta, src);
    if (!existsSync(archivo)) return;
    const marca = `/* ---------- ${src} ---------- */`;
    if (guiones.some((g) => g.startsWith(marca))) return;
    guiones.push(marca + '\n' + readFileSync(archivo, 'utf8').trim());
  };

  marcado = marcado.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
    (entero, atributos, dentro) => {
      const src = (atributos.match(/src="([^"]+)"/) ?? [])[1];
      if (src) tragarArchivo(src);
      else guiones.push(dentro);
      return '';
    },
  );

  // el <head> también puede cargar scripts propios
  for (const [, atributos] of html.matchAll(/<script\b([^>]*)>\s*<\/script>/g)) {
    const src = (atributos.match(/src="([^"]+)"/) ?? [])[1];
    if (src) tragarArchivo(src);
  }

  // el enlace de volver se queda donde estaba, pero apuntando al salón nuevo
  // (pantalla.js y sonido.js cuelgan sus botones justo antes de él)
  marcado = marcado.replace(/(<a[^>]*class="back"[^>]*href=")[^"]*(")/g, '$1/$2');
  marcado = marcado.replace(/\n{3,}/g, '\n\n').trim();

  const jsx = htmlAJsx(marcado);

  writeFileSync(
    join(salida, 'marcado.tsx'),
    `/* El panel y el lienzo de la cabina ${carpeta}, pasados a JSX.\n` +
      `   Los identificadores son los mismos que buscaba el juego original,\n` +
      `   así que el motor los encuentra sin cambiar una línea. */\n\n` +
      `export default function Marcado() {\n` +
      `  return (\n` +
      `    <>\n` +
      sangrar(jsx, 6) +
      `\n    </>\n` +
      `  );\n` +
      `}\n`,
    'utf8',
  );

  // ---- motor ----
  const mandos = guiones.filter((g) => /window\.MANDO\s*=/.test(g));
  let motor = guiones
    .filter((g) => !/window\.MANDO\s*=/.test(g) && g.trim().length > 40)
    .map((g) => g.trim())
    .join('\n\n');

  // el material vive ahora bajo /juegos/<carpeta>/ dentro de la carpeta pública
  motor = motor.replace(/(['"`])assets\//g, `$1/juegos/${carpeta}/assets/`);

  let mando = '{}';
  if (mandos.length) {
    const m = mandos[0].match(/window\.MANDO\s*=\s*([\s\S]*?);?\s*$/);
    if (m) mando = m[1].trim().replace(/;$/, '');
  }

  writeFileSync(
    join(salida, 'motor.js'),
    `/**\n` +
      ` * Motor de la cabina ${carpeta}.\n` +
      ` *\n` +
      ` * Es el mismo JavaScript que corría en la página suelta, sin reescribir.\n` +
      ` * Lo único nuevo es la envoltura: al desestructurar el entorno, los\n` +
      ` * nombres de abajo tapan a los globales, de modo que cada escucha, cada\n` +
      ` * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer\n` +
      ` * cuando React desmonta la cabina.\n` +
      ` *\n` +
      ` * Generado por herramientas/convertir-cabinas.mjs\n` +
      ` */\n\n` +
      `export const MANDO = ${mando};\n\n` +
      `export function iniciar(entorno) {\n` +
      `  const {\n` +
      `    document,\n` +
      `    window,\n` +
      `    requestAnimationFrame,\n` +
      `    cancelAnimationFrame,\n` +
      `    setTimeout,\n` +
      `    clearTimeout,\n` +
      `    setInterval,\n` +
      `    clearInterval,\n` +
      `  } = entorno;\n\n` +
      sangrar(motor.trim(), 2) +
      `\n}\n`,
    'utf8',
  );

  // ---- la cabina como componente ----
  writeFileSync(
    join(salida, 'index.tsx'),
    `'use client';\n\n` +
      `/* Cabina ${carpeta}. Junta las tres piezas: estilos, panel y motor.\n` +
      `   Generado por herramientas/convertir-cabinas.mjs */\n\n` +
      `import Cabina from '@/componentes/Cabina';\n` +
      `import Marcado from './marcado';\n` +
      `import { iniciar, MANDO } from './motor';\n` +
      `import './estilos.css';\n\n` +
      `export default function CabinaJuego() {\n` +
      `  return (\n` +
      `    <Cabina carpeta="${carpeta}" iniciar={iniciar} mando={MANDO}>\n` +
      `      <Marcado />\n` +
      `    </Cabina>\n` +
      `  );\n` +
      `}\n`,
    'utf8',
  );

  const lineas = motor.trim().split('\n').length;
  console.log(`  · ${carpeta}: ${lineas} líneas de motor, ${jsx.split('\n').length} de marcado`);
  return true;
}

/** Índice para que la ruta [cabina] sepa qué componente cargar. */
function escribirRegistro(cabinas) {
  const filas = cabinas
    .map(
      (c) =>
        `  '${c}': dynamic(() => import('@/juegos/${c}'), {\n` +
        `    ssr: false,\n` +
        `    loading: () => <PantallaDeCarga />,\n` +
        `  }),`,
    )
    .join('\n');

  writeFileSync(
    join(DESTINO, 'registro.tsx'),
    `'use client';\n\n` +
      `/**\n` +
      ` * Qué componente monta cada cabina.\n` +
      ` *\n` +
      ` * Cada juego llega por su propio trozo de código y con su propia hoja de\n` +
      ` * estilos, así que abrir el salón no descarga los dieciocho a la vez y\n` +
      ` * ninguna cabina hereda el CSS de otra.\n` +
      ` *\n` +
      ` * Generado por herramientas/convertir-cabinas.mjs\n` +
      ` */\n\n` +
      `import dynamic from 'next/dynamic';\n` +
      `import type { ComponentType } from 'react';\n\n` +
      `function PantallaDeCarga() {\n` +
      `  return <p className="cargando-cabina">ENCENDIENDO LA CABINA…</p>;\n` +
      `}\n\n` +
      `export const CABINAS_MONTABLES: Record<string, ComponentType> = {\n` +
      filas +
      `\n};\n`,
    'utf8',
  );
  console.log(`  · registro.tsx con ${cabinas.length} cabinas`);
}

/** Las dieciocho, en el orden en el que se registran. */
const TODAS = [
  '02-game', '03-arkanoid', '05-tetris', '06-snake', '07-pong',
  '08-invaders', '09-vuelo-rasante', '10-simon', '11-campo-minado',
  '12-fusion', '13-rompecabezas', '14-asteroides', '15-cruce',
  '16-cuatro-en-linea', '17-tanques', '18-filo-de-sombra',
  '19-fuera-de-combate', '35-fontanero',
];

const pedidas = process.argv.slice(2);
const CABINAS = pedidas.length ? pedidas : TODAS;

console.log('Convirtiendo cabinas:');
const logradas = [];
for (const cabina of CABINAS) if (convertir(cabina)) logradas.push(cabina);

// El registro nombra todas las cabinas que ya están convertidas, no solo las
// de esta pasada: convertir una sola no puede dejar fuera a las otras.
escribirRegistro(
  TODAS.filter(
    (c) => logradas.includes(c) || existsSync(join(DESTINO, c, 'index.tsx')),
  ),
);
console.log(`Listo: ${logradas.length} de ${CABINAS.length}.`);

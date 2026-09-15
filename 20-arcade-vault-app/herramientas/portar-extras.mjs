/**
 * Envuelve los tres acompañantes del salón (pantalla completa, mando táctil
 * y sonido) para que puedan montarse y desmontarse con la cabina.
 *
 *   node herramientas/portar-extras.mjs
 *
 * Como con los motores, el código no se reescribe: se mete dentro de una
 * función que recibe el entorno vigilado, de modo que sus escuchas y sus
 * relojes se puedan deshacer al salir del juego.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ORIGEN = resolve(AQUI, '..', '..', '04-arcade-vault');
const DESTINO = resolve(AQUI, '..', 'web', 'src', 'extras');

const EXTRAS = [
  ['pantalla.js', 'Encaje y pantalla completa de la cabina.'],
  ['movil.js', 'Mando táctil para pantallas pequeñas.'],
  ['sonido.js', 'Efectos y música sintetizados con la Web Audio API.'],
];

mkdirSync(DESTINO, { recursive: true });

for (const [archivo, resumen] of EXTRAS) {
  const codigo = readFileSync(join(ORIGEN, archivo), 'utf8').trim();

  const envuelto =
    `/**\n` +
    ` * ${resumen}\n` +
    ` *\n` +
    ` * Portado tal cual desde 04-arcade-vault/${archivo}. Lo único añadido es la\n` +
    ` * envoltura: al desestructurar el entorno, esos nombres tapan a los globales\n` +
    ` * y todo lo que este archivo cuelgue se puede retirar al desmontar la cabina.\n` +
    ` *\n` +
    ` * Generado por herramientas/portar-extras.mjs\n` +
    ` */\n\n` +
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
    codigo
      .split('\n')
      .map((l) => (l.trim() ? '  ' + l : ''))
      .join('\n') +
    `\n}\n`;

  const salida = archivo.replace(/\.js$/, '.js');
  writeFileSync(join(DESTINO, salida), envuelto, 'utf8');
  console.log(`  · ${archivo} → src/extras/${salida}`);
}

console.log('Extras portados.');

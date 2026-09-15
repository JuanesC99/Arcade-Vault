'use client';

/**
 * La pantalla de encendido de la cabina.
 *
 * Ninguna consola arranca la partida sola: primero pasa su comprobación,
 * pide crédito y espera el botón. Aquí igual. Mientras esta pantalla está
 * puesta el motor del juego no corre, así que el jugador lee los controles
 * con la cabina quieta y la partida empieza cuando él dice.
 */

import { useEffect, useRef, useState } from 'react';
import type { Cabina } from '@/lib/catalogo';

/** Las líneas de la comprobación, con el retardo con el que van saliendo. */
const COMPROBACION = [
  'ARCADE VAULT BIOS v1.0',
  'MEMORIA DE VIDEO ..... OK',
  'MANDO Y TECLADO ...... OK',
  'MARCADOR DEL SALON ... OK',
];

const PASO_MS = 260;

interface Props {
  cabina: Cabina | undefined;
  carpeta: string;
  alias: string | null;
  onEmpezar: () => void;
}

export default function Arranque({ cabina, carpeta, alias, onEmpezar }: Props) {
  const [lineas, setLineas] = useState(1);
  const boton = useRef<HTMLButtonElement>(null);

  // la comprobación se va escribiendo sola; nadie tiene que esperarla
  useEffect(() => {
    if (lineas >= COMPROBACION.length) return;
    const reloj = setTimeout(() => setLineas((n) => n + 1), PASO_MS);
    return () => clearTimeout(reloj);
  }, [lineas]);

  // cualquier tecla vale de botón de start, como en la máquina de verdad
  useEffect(() => {
    boton.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab') return;
      e.preventDefault();
      onEmpezar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onEmpezar]);

  const numero = carpeta.slice(0, 2);
  const listo = lineas >= COMPROBACION.length;

  return (
    <div className="arranque" role="dialog" aria-label="Encender la cabina">
      <div className="arranque-caja">
        <p className="arranque-cabecera">
          ARCADE VAULT · CABINA {numero}
        </p>

        <h1 className="arranque-titulo">
          {(cabina?.titulo ?? carpeta).toUpperCase()}
        </h1>

        <ol className="arranque-chequeo" aria-hidden="true">
          {COMPROBACION.slice(0, lineas).map((linea) => (
            <li key={linea}>{linea}</li>
          ))}
        </ol>

        {cabina && (
          <dl className="arranque-ficha">
            <div>
              <dt>Género</dt>
              <dd>{cabina.genero}</dd>
            </div>
            <div>
              <dt>Jugadores</dt>
              <dd>{cabina.jugadores}</dd>
            </div>
            <div>
              <dt>Controles</dt>
              <dd>{cabina.controles}</dd>
            </div>
          </dl>
        )}

        <p className="arranque-credito">
          CREDITO 01 · {alias ? `JUGADOR ${alias}` : 'JUGADOR INVITADO'}
        </p>

        <button
          ref={boton}
          type="button"
          className={`arranque-start${listo ? ' listo' : ''}`}
          onClick={onEmpezar}
        >
          PULSA START
        </button>

        <p className="arranque-pie">
          Cualquier tecla o un clic encienden la cabina.
          {!alias && (
            <>
              {' '}
              Sin ficha la partida se queda en este navegador:{' '}
              <a href="/acceso">entra con la tuya</a>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

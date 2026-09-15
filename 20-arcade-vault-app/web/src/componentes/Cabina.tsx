'use client';

/**
 * El marco donde vive un juego.
 *
 * Monta el panel, prepara el entorno vigilado, cuelga el marcador y los
 * acompañantes del salón (pantalla completa, mando táctil y sonido) y
 * arranca el motor. Al desmontar se deshace todo en orden inverso, de modo
 * que salir de una cabina y entrar en otra no deja bucles ni escuchas
 * sueltas por detrás.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Arranque from '@/componentes/Arranque';
import { buscarCabina } from '@/lib/catalogo';
import { crearEntorno, type EntornoCabina } from '@/lib/entorno';
import { instalarMarcador } from '@/lib/marcador';
import { useSesion } from '@/lib/sesion';
import { iniciar as iniciarPantalla } from '@/extras/pantalla';
import { iniciar as iniciarMovil } from '@/extras/movil';
import { iniciar as iniciarSonido } from '@/extras/sonido';

interface Props {
  carpeta: string;
  iniciar: (entorno: EntornoCabina) => void;
  mando?: unknown;
  children: ReactNode;
}

interface Resultado {
  valor: number;
  puesto: number;
  subida: boolean;
}

export default function Cabina({ carpeta, iniciar, mando, children }: Props) {
  const { jugador, token, cargando } = useSesion();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [encendida, setEncendida] = useState(false);
  const encender = useCallback(() => setEncendida(true), []);

  useEffect(() => {
    // esperamos a saber quién juega para firmar bien la primera partida
    if (cargando) return;
    // y a que alguien pulse start: hasta entonces la cabina está apagada
    if (!encendida) return;

    const entorno = crearEntorno();
    const alias = jugador?.alias ?? 'INVITADO';

    // los juegos hablan con el marcador y con el mando por el objeto global,
    // igual que cuando eran páginas sueltas
    const quitarMarcador = instalarMarcador(token, alias, setResultado);
    const mandoAnterior = window.MANDO;
    window.MANDO = mando ?? {};

    try {
      iniciar(entorno);
      iniciarPantalla(entorno);
      iniciarSonido(entorno);
      iniciarMovil(entorno);
    } catch (error) {
      console.error(`La cabina ${carpeta} no arrancó:`, error);
    }

    return () => {
      entorno.limpiar();
      quitarMarcador();
      window.MANDO = mandoAnterior;
    };
    // el efecto corre una vez por cabina, cuando ya sabemos quién juega
    // y la cabina está encendida
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, encendida]);

  return (
    <div className="cabina-marco">
      {children}
      {!cargando && !encendida && (
        <Arranque
          cabina={buscarCabina(carpeta)}
          carpeta={carpeta}
          alias={jugador?.alias ?? null}
          onEmpezar={encender}
        />
      )}
      {resultado && (
        <div className="cabina-parte" role="status">
          {resultado.subida ? (
            <>
              Marca de <b>{resultado.valor}</b> guardada
              {resultado.puesto ? ` · puesto ${resultado.puesto} del salón` : ''}
            </>
          ) : (
            <>
              Marca de <b>{resultado.valor}</b> guardada solo en este navegador.
              <a href="/acceso"> Entra con tu ficha</a> para subirla.
            </>
          )}
        </div>
      )}
    </div>
  );
}

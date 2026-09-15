'use client';

/**
 * El puente entre las cabinas y el marcador del servidor.
 *
 * Los juegos llaman siempre igual, tal como lo hacían en la versión de HTML
 * plano:
 *
 *     window.Hall && Hall.registrar('06-snake', score, { unidad: 'pts' });
 *
 * Aquí se instala ese `Hall` mientras la cabina está montada. Con sesión
 * abierta la partida sube a la API; sin ella se queda en el navegador, para
 * que jugar de invitado siga teniendo marcador aunque no salga en el salón
 * de la fama compartido.
 */

import { api, type NuevaMarca } from './api';

const LLAVE_INVITADO = 'arcadeVault:marcasInvitado';

export interface MarcaInvitado {
  juego: string;
  valor: number;
  unidad: string;
  etiqueta: string;
  menorEsMejor: boolean;
  creada: string;
}

interface OpcionesMarca {
  unidad?: string;
  etiqueta?: string;
  menorEsMejor?: boolean;
}

export interface HallDeCabina {
  jugador: () => string;
  registrar: (juego: string, valor: number, opciones?: OpcionesMarca) => number;
}

declare global {
  interface Window {
    Hall?: HallDeCabina;
    MANDO?: unknown;
    Sonido?: unknown;
  }
}

export function marcasDeInvitado(): MarcaInvitado[] {
  try {
    const crudo = localStorage.getItem(LLAVE_INVITADO);
    return crudo ? (JSON.parse(crudo) as MarcaInvitado[]) : [];
  } catch {
    return [];
  }
}

function guardarInvitado(marca: MarcaInvitado): void {
  try {
    const todas = [marca, ...marcasDeInvitado()].slice(0, 50);
    localStorage.setItem(LLAVE_INVITADO, JSON.stringify(todas));
  } catch {
    /* sin almacenamiento la partida se pierde, y no pasa nada */
  }
}

export function olvidarMarcasDeInvitado(): void {
  try {
    localStorage.removeItem(LLAVE_INVITADO);
  } catch {
    /* nada que borrar */
  }
}

/**
 * Cuelga `window.Hall` para esta cabina y devuelve cómo quitarlo.
 * `avisar` sirve para que la página reaccione a la partida recién guardada.
 */
export function instalarMarcador(
  token: string | null,
  alias: string,
  avisar?: (resultado: { valor: number; puesto: number; subida: boolean }) => void,
): () => void {
  const anterior = window.Hall;

  const hall: HallDeCabina = {
    jugador: () => alias,

    registrar(juego, valor, opciones = {}) {
      const marca: NuevaMarca = {
        juego,
        valor: Math.round(Number(valor)),
        unidad: opciones.unidad ?? 'pts',
        etiqueta: opciones.etiqueta ?? '',
        menorEsMejor: !!opciones.menorEsMejor,
      };
      if (!Number.isFinite(marca.valor)) return 0;

      if (!token) {
        guardarInvitado({ ...marca, unidad: marca.unidad!, etiqueta: marca.etiqueta!, menorEsMejor: !!marca.menorEsMejor, creada: new Date().toISOString() });
        avisar?.({ valor: marca.valor, puesto: 0, subida: false });
        return 0;
      }

      // La cabina no espera: la partida sube por detrás.
      api
        .registrarMarca(token, marca)
        .then(({ puesto }) => avisar?.({ valor: marca.valor, puesto, subida: true }))
        .catch(() => {
          guardarInvitado({ ...marca, unidad: marca.unidad!, etiqueta: marca.etiqueta!, menorEsMejor: !!marca.menorEsMejor, creada: new Date().toISOString() });
          avisar?.({ valor: marca.valor, puesto: 0, subida: false });
        });

      return 0;
    },
  };

  window.Hall = hall;
  return () => {
    if (window.Hall === hall) window.Hall = anterior;
  };
}

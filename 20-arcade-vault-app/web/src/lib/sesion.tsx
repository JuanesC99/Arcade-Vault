'use client';

/**
 * La sesión del salón, compartida por toda la aplicación.
 *
 * El token va en localStorage para que aguante recargas y pestañas nuevas;
 * al arrancar se comprueba contra el servidor, así que un token caducado se
 * tira solo en lugar de dejar una sesión fantasma.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, type Jugador } from './api';

const LLAVE = 'arcadeVault:token';

interface ValorSesion {
  jugador: Jugador | null;
  token: string | null;
  /** true mientras se comprueba el token guardado al arrancar */
  cargando: boolean;
  entrar: (usuario: string, clave: string) => Promise<void>;
  registrar: (usuario: string, alias: string, clave: string) => Promise<void>;
  salir: () => void;
  refrescar: (jugador: Jugador) => void;
}

const Contexto = createContext<ValorSesion | null>(null);

function leerToken(): string | null {
  try {
    return localStorage.getItem(LLAVE);
  } catch {
    return null;
  }
}

function guardarToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(LLAVE, token);
    else localStorage.removeItem(LLAVE);
  } catch {
    /* navegador sin almacenamiento: la sesión durará lo que la pestaña */
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // al montar, recuperamos el token y preguntamos al servidor si sigue valiendo
  useEffect(() => {
    const guardado = leerToken();
    if (!guardado) {
      setCargando(false);
      return;
    }

    let vivo = true;
    api
      .yo(guardado)
      .then((j) => {
        if (!vivo) return;
        setJugador(j);
        setToken(guardado);
      })
      .catch(() => {
        if (!vivo) return;
        guardarToken(null);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  const aceptar = useCallback((sesion: { jugador: Jugador; token: string }) => {
    guardarToken(sesion.token);
    setToken(sesion.token);
    setJugador(sesion.jugador);
  }, []);

  const entrar = useCallback(
    async (usuario: string, clave: string) => {
      aceptar(await api.acceso(usuario, clave));
    },
    [aceptar],
  );

  const registrar = useCallback(
    async (usuario: string, alias: string, clave: string) => {
      aceptar(await api.registro(usuario, alias, clave));
    },
    [aceptar],
  );

  const salir = useCallback(() => {
    guardarToken(null);
    setToken(null);
    setJugador(null);
  }, []);

  const valor = useMemo<ValorSesion>(
    () => ({ jugador, token, cargando, entrar, registrar, salir, refrescar: setJugador }),
    [jugador, token, cargando, entrar, registrar, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSesion necesita estar dentro de <ProveedorSesion>.');
  return valor;
}

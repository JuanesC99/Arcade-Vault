/**
 * Cliente de la API del salón (el servicio Nest).
 *
 * Todo lo que va y viene pasa por aquí, así que es el único sitio que sabe
 * dónde vive el servidor y cómo se manda el token.
 */

export const BASE_API =
  process.env.NEXT_PUBLIC_API ?? 'http://localhost:3001/api';

export interface Jugador {
  id: string;
  usuario: string;
  alias: string;
  creado: string;
}

export interface Sesion {
  jugador: Jugador;
  token: string;
}

export interface Marca {
  id: string;
  juego: string;
  alias: string;
  valor: number;
  unidad: string;
  etiqueta: string;
  creada: string;
}

export interface CabinaDelHall {
  juego: string;
  menorEsMejor: boolean;
  unidad: string;
  marcas: Marca[];
}

export interface NuevaMarca {
  juego: string;
  valor: number;
  unidad?: string;
  etiqueta?: string;
  menorEsMejor?: boolean;
}

/** Error con el mensaje que mandó el servidor, listo para enseñar. */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

function mensajeDe(cuerpo: unknown, estado: number): string {
  if (cuerpo && typeof cuerpo === 'object' && 'message' in cuerpo) {
    const m = (cuerpo as { message: unknown }).message;
    if (Array.isArray(m)) return String(m[0]);
    if (typeof m === 'string') return m;
  }
  if (estado === 0) return 'No hay servidor del salón escuchando.';
  return 'Algo falló en el salón.';
}

async function pedir<T>(
  ruta: string,
  opciones: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...resto } = opciones;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_API}${ruta}`, {
      ...resto,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ErrorApi('No hay servidor del salón escuchando.', 0);
  }

  if (respuesta.status === 204) return undefined as T;

  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(mensajeDe(cuerpo, respuesta.status), respuesta.status);
  return cuerpo as T;
}

export const api = {
  salud: () => pedir<{ ok: boolean }>('/salud'),

  registro: (usuario: string, alias: string, clave: string) =>
    pedir<Sesion>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ usuario, alias, clave }),
    }),

  acceso: (usuario: string, clave: string) =>
    pedir<Sesion>('/auth/acceso', {
      method: 'POST',
      body: JSON.stringify({ usuario, clave }),
    }),

  yo: (token: string) => pedir<Jugador>('/auth/yo', { token }),

  cambiarAlias: (token: string, alias: string) =>
    pedir<Jugador>('/auth/alias', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ alias }),
    }),

  cambiarClave: (token: string, actual: string, nueva: string) =>
    pedir<void>('/auth/clave', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ actual, nueva }),
    }),

  borrarCuenta: (token: string, usuario: string, clave: string) =>
    pedir<void>('/auth/cuenta', {
      method: 'DELETE',
      token,
      body: JSON.stringify({ usuario, clave }),
    }),

  hall: () => pedir<CabinaDelHall[]>('/marcas/hall'),

  misMarcas: (token: string) => pedir<Marca[]>('/marcas/mias', { token }),

  registrarMarca: (token: string, marca: NuevaMarca) =>
    pedir<{ marca: Marca; puesto: number }>('/marcas', {
      method: 'POST',
      token,
      body: JSON.stringify(marca),
    }),
};

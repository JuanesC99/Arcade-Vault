/**
 * El entorno de una cabina.
 *
 * Los juegos vienen de páginas sueltas: se cargaban, montaban sus escuchas y
 * su bucle, y vivían hasta que cerrabas la pestaña. Dentro de React una
 * cabina se monta y se desmonta muchas veces, así que hace falta poder
 * deshacer todo lo que el juego dejó puesto.
 *
 * En lugar de tocar la lógica de cada juego, aquí se preparan versiones
 * vigiladas de `document`, `window`, los temporizadores y los cuadros de
 * animación. El motor de cada cabina las recibe y las desestructura, con lo
 * que dentro de su código esos nombres tapan a los globales de siempre y el
 * juego se escribe igual que antes. Al desmontar, `limpiar()` retira las
 * escuchas, para los relojes y corta el bucle.
 */

type Escucha = () => void;

export interface EntornoCabina {
  document: Document;
  window: Window & typeof globalThis;
  requestAnimationFrame: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
  setTimeout: (fn: (...args: unknown[]) => void, ms?: number) => number;
  clearTimeout: (id: number) => void;
  setInterval: (fn: (...args: unknown[]) => void, ms?: number) => number;
  clearInterval: (id: number) => void;
  /** true cuando la cabina ya se desmontó: el bucle debe rendirse */
  cerrada: () => boolean;
  limpiar: Escucha;
}

/** Envuelve un EventTarget para apuntar cada escucha que se le cuelga. */
function vigilar<T extends EventTarget>(
  real: T,
  apuntar: (deshacer: Escucha) => void,
  apuntarEspera: (tarea: Escucha) => void,
  apuntarNodo?: (nodo: Element) => void,
): T {
  return new Proxy(real, {
    get(objetivo, clave) {
      if (clave === 'addEventListener') {
        return (tipo: string, fn: EventListenerOrEventListenerObject, opciones?: unknown) => {
          // Una cabina montada a mitad de partida se perdería el `load` y el
          // `DOMContentLoaded` de la página, que ya pasaron hace rato. Como
          // varios juegos arrancan justo ahí, se les avisa igualmente.
          if (tipo === 'load' || tipo === 'DOMContentLoaded') {
            const yaPaso =
              tipo === 'load'
                ? document.readyState === 'complete'
                : document.readyState !== 'loading';
            if (yaPaso) {
              const disparar = () => {
                if (typeof fn === 'function') fn.call(real, new Event(tipo));
                else fn.handleEvent(new Event(tipo));
              };
              // en un hueco aparte, para no bloquear el montaje
              apuntarEspera(disparar);
              return;
            }
          }

          real.addEventListener(tipo, fn, opciones as AddEventListenerOptions);
          apuntar(() => real.removeEventListener(tipo, fn, opciones as EventListenerOptions));
        };
      }

      // Los botones, avisos y hojas de estilo que la cabina se fabrica también
      // hay que poder quitarlos: los apuntamos según nacen.
      if (apuntarNodo && (clave === 'createElement' || clave === 'createElementNS')) {
        const original = Reflect.get(objetivo as object, clave, objetivo) as (
          ...args: unknown[]
        ) => Element;
        return (...args: unknown[]) => {
          const nodo = original.apply(objetivo, args);
          apuntarNodo(nodo);
          return nodo;
        };
      }

      // el receptor es el objeto real: si no, los getters del DOM protestan
      const valor = Reflect.get(objetivo as object, clave, objetivo);
      return typeof valor === 'function' ? valor.bind(objetivo) : valor;
    },
    set(objetivo, clave, valor) {
      Reflect.set(objetivo as object, clave, valor, objetivo);
      return true;
    },
  }) as T;
}

export function crearEntorno(): EntornoCabina {
  const deshacer: Escucha[] = [];
  const cuadros = new Set<number>();
  const esperas = new Set<number>();
  const relojes = new Set<number>();
  let cerrada = false;

  const apuntar = (fn: Escucha) => {
    deshacer.push(fn);
  };

  const nacidos: Element[] = [];

  /** Tareas que corren en cuanto acaba el montaje, si no se canceló antes. */
  const enCuantoSePueda = (tarea: Escucha) => {
    const id = window.setTimeout(() => {
      esperas.delete(id);
      if (!cerrada) tarea();
    }, 0);
    esperas.add(id);
  };

  const doc = vigilar(document, apuntar, enCuantoSePueda, (nodo) => nacidos.push(nodo));
  const win = vigilar(window, apuntar, enCuantoSePueda) as Window & typeof globalThis;

  return {
    document: doc,
    window: win,

    requestAnimationFrame(cb) {
      if (cerrada) return 0;
      const id = window.requestAnimationFrame((t) => {
        cuadros.delete(id);
        if (!cerrada) cb(t);
      });
      cuadros.add(id);
      return id;
    },

    cancelAnimationFrame(id) {
      cuadros.delete(id);
      window.cancelAnimationFrame(id);
    },

    setTimeout(fn, ms) {
      if (cerrada) return 0;
      const id = window.setTimeout(() => {
        esperas.delete(id);
        if (!cerrada) fn();
      }, ms);
      esperas.add(id);
      return id;
    },

    clearTimeout(id) {
      esperas.delete(id);
      window.clearTimeout(id);
    },

    setInterval(fn, ms) {
      if (cerrada) return 0;
      const id = window.setInterval(() => {
        if (!cerrada) fn();
      }, ms);
      relojes.add(id);
      return id;
    },

    clearInterval(id) {
      relojes.delete(id);
      window.clearInterval(id);
    },

    cerrada: () => cerrada,

    limpiar() {
      cerrada = true;
      cuadros.forEach((id) => window.cancelAnimationFrame(id));
      esperas.forEach((id) => window.clearTimeout(id));
      relojes.forEach((id) => window.clearInterval(id));
      cuadros.clear();
      esperas.clear();
      relojes.clear();
      while (deshacer.length) deshacer.pop()!();

      // Del último al primero, para que los hijos se vayan antes que su padre.
      // Si el nodo envolvía algo que ya estaba en la página (pantalla.js mete
      // el marco del juego en una caja para poder escalarlo), eso se devuelve
      // a su sitio; lo que nació con la cabina se va con ella.
      const propios = new Set(nacidos);
      for (let i = nacidos.length - 1; i >= 0; i--) {
        const nodo = nacidos[i];
        const padre = nodo.parentNode;
        if (!padre) continue;

        for (const hijo of Array.from(nodo.children)) {
          if (!propios.has(hijo)) padre.insertBefore(hijo, nodo);
        }
        padre.removeChild(nodo);
      }
      nacidos.length = 0;
    },
  };
}

/** Lo que exporta el motor de cada cabina. */
export type MotorCabina = (entorno: EntornoCabina) => void | Escucha;

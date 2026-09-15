'use client';

/**
 * La biblioteca: filtro por género, rejilla de fichas, vista previa en un
 * marco y la lista lateral con todas las cabinas.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CABINAS, GENEROS, rutaDe, type Cabina } from '@/lib/catalogo';

function Ficha({ cabina, alPrevisualizar }: { cabina: Cabina; alPrevisualizar: (c: Cabina) => void }) {
  return (
    <Link className="card" href={rutaDe(cabina)}>
      <div className={`art ${cabina.arte}`} />
      <div className="pad">
        <h4>{cabina.titulo}</h4>
        <span className="genre">
          {cabina.genero} · {cabina.carpeta}
        </span>
        <p className="mini">
          {cabina.jugadores} · {cabina.controles}
        </p>
        <div className="foot">
          <span className="now">GRATIS</span>
          <span className="acciones">
            <button
              className="ojo"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                alPrevisualizar(cabina);
              }}
            >
              VISTA PREVIA
            </button>
            <span className="go">JUGAR</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Biblioteca() {
  const [genero, setGenero] = useState('todos');
  const [previa, setPrevia] = useState<Cabina | null>(null);

  const lista = useMemo(
    () => (genero === 'todos' ? CABINAS : CABINAS.filter((c) => c.genero === genero)),
    [genero],
  );

  // La cabina de la vista previa no cambia de tamaño: se encoge entera con
  // una escala que depende del hueco que deja la ventana.
  useEffect(() => {
    if (!previa) return;

    const encajar = () => {
      const k = Math.min(0.66, (innerWidth - 40) / 1200, (innerHeight - 190) / 820);
      document.documentElement.style.setProperty('--previa', String(Math.max(0.22, k)));
    };
    const teclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrevia(null);
    };

    encajar();
    window.addEventListener('resize', encajar);
    document.addEventListener('keydown', teclado);
    return () => {
      window.removeEventListener('resize', encajar);
      document.removeEventListener('keydown', teclado);
    };
  }, [previa]);

  return (
    <>
      <div className="chips">
        <div className="chips-inner">
          {GENEROS.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip${g === genero ? ' on' : ''}`}
              onClick={() => setGenero(g)}
            >
              {g === 'todos' ? 'Todos' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="columns" id="biblioteca">
        <div>
          <p className="eyebrow" id="catalogo">
            BIBLIOTECA DEL SALÓN
          </p>
          <div className="grid">
            {lista.map((c) => (
              <Ficha key={c.carpeta} cabina={c} alPrevisualizar={setPrevia} />
            ))}
            {!lista.length && (
              <p style={{ color: 'var(--dim)' }}>Ninguna cabina de ese tipo en el salón.</p>
            )}
          </div>
        </div>

        <aside>
          <div className="side">
            <h3>TODAS LAS CABINAS</h3>
            <div>
              {CABINAS.map((c, i) => (
                <Link className="rank" key={c.carpeta} href={rutaDe(c)}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`art ${c.arte}`} />
                  <span className="t">
                    <b>{c.titulo}</b>
                    <span>{c.genero}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="marquee">
            <h3>AVISOS</h3>
            <div className="ticker">
              <span>
                TODAS LAS CABINAS CORREN EN TU NAVEGADOR · DIECISIETE JUEGOS EN REACT ·
                PULSA P PARA PAUSAR EN CUALQUIERA · ENTRA CON TU FICHA PARA SUBIR MARCAS ·
                NO GOLPEES LA MÁQUINA
              </span>
            </div>
          </div>
        </aside>
      </div>

      {previa && (
        <div className="modal show" onClick={() => setPrevia(null)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <div className="modal-barra">
              <h3>{previa.titulo.toUpperCase()}</h3>
              <Link className="abrir" href={rutaDe(previa)}>
                JUGAR EN GRANDE
              </Link>
              <button className="cerrar" type="button" onClick={() => setPrevia(null)}>
                CERRAR
              </button>
            </div>
            <div className="marco">
              <iframe src={rutaDe(previa)} title={`Vista previa de ${previa.titulo}`} allow="fullscreen" />
            </div>
            <div className="modal-pie">
              La cabina corre aquí dentro. Haz clic sobre ella para que reciba el teclado.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

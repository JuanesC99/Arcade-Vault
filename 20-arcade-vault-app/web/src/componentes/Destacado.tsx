'use client';

/** La cabina destacada, con su tira de miniaturas para cambiar de juego. */

import Link from 'next/link';
import { useState } from 'react';
import { CABINAS, rutaDe } from '@/lib/catalogo';

export default function Destacado() {
  const [cual, setCual] = useState(0);
  const cabina = CABINAS[cual];

  return (
    <>
      <p className="eyebrow">CABINA DESTACADA</p>

      <section className="hero">
        <div className={`hero-art art ${cabina.arte}`}>
          <span className="hero-badge">EN CABINA</span>
          <span className="scan" />
        </div>

        <div className="hero-side">
          <h2 className="hero-title">{cabina.titulo}</h2>
          <p className="hero-desc">{cabina.descripcion}</p>

          <div className="meta">
            <span>
              Carpeta · <b>{cabina.carpeta}</b>
            </span>
            <span>
              Jugadores · <b>{cabina.jugadores}</b>
            </span>
            <span>
              Controles · <b>{cabina.controles}</b>
            </span>
          </div>

          <div className="tags">
            {cabina.etiquetas.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>

          <div className="buyrow">
            <div className="price-box">
              <span className="now">GRATIS</span>
            </div>
            <Link className="btn" href={rutaDe(cabina)}>
              JUGAR AHORA
            </Link>
          </div>
        </div>
      </section>

      <div className="strip">
        {CABINAS.map((c, i) => (
          <button
            key={c.carpeta}
            type="button"
            className={`art ${c.arte} thumb${i === cual ? ' on' : ''}`}
            onClick={() => setCual(i)}
            aria-label={`Ver ${c.titulo}`}
          >
            <i>{c.titulo.toUpperCase()}</i>
          </button>
        ))}
      </div>
    </>
  );
}

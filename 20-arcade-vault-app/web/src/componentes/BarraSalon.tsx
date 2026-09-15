'use client';

/**
 * La barra de arriba: navegación, ficha de sesión y contador de cabinas.
 * El enlace activo lo decide un observador de secciones, igual que antes,
 * pero solo cuando estamos en la portada.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CABINAS } from '@/lib/catalogo';
import { useSesion } from '@/lib/sesion';

const ENLACES = [
  { href: '#inicio', texto: 'Inicio' },
  { href: '#biblioteca', texto: 'Biblioteca' },
  { href: '#hall', texto: 'Salón de la Fama' },
  { href: '#acerca', texto: 'Acerca de' },
];

export default function BarraSalon() {
  const ruta = usePathname();
  const enPortada = ruta === '/';
  const { jugador } = useSesion();
  const [activo, setActivo] = useState('#inicio');

  useEffect(() => {
    if (!enPortada) return;

    const destinos = ENLACES.map((e) => ({
      href: e.href,
      seccion: document.querySelector(e.href),
    })).filter((d): d is { href: string; seccion: Element } => !!d.seccion);

    if (!destinos.length) return;

    const vistas = new Set<Element>();
    const ojo = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) =>
          e.isIntersecting ? vistas.add(e.target) : vistas.delete(e.target),
        );
        // manda la sección visible que aparece antes en la página
        const primera = destinos.find((d) => vistas.has(d.seccion));
        if (primera) setActivo(primera.href);
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    destinos.forEach((d) => ojo.observe(d.seccion));
    return () => ojo.disconnect();
  }, [enPortada]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="logo" href="/">
          ARCADE<span>VAULT</span>
        </Link>

        <nav className="nav" id="nav">
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={enPortada ? e.href : `/${e.href}`}
              className={enPortada && activo === e.href ? 'on' : undefined}
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <Link
          className={`sesion${jugador ? '' : ' fuera'}`}
          href="/acceso"
          title={jugador ? `Sesión de @${jugador.usuario}` : 'Cuentas del salón'}
        >
          <span className="avatar">{jugador ? jugador.alias.slice(0, 1) : '?'}</span>
          <span>{jugador ? jugador.alias : 'ENTRAR'}</span>
        </Link>

        <div className="wallet">
          <span className="coin" /> {CABINAS.length} CABINAS
        </div>
      </div>
    </header>
  );
}

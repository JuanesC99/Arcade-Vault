'use client';

/**
 * Qué componente monta cada cabina.
 *
 * Cada juego llega por su propio trozo de código y con su propia hoja de
 * estilos, así que abrir el salón no descarga los dieciocho a la vez y
 * ninguna cabina hereda el CSS de otra.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

function PantallaDeCarga() {
  return <p className="cargando-cabina">ENCENDIENDO LA CABINA…</p>;
}

export const CABINAS_MONTABLES: Record<string, ComponentType> = {
  '02-game': dynamic(() => import('@/juegos/02-game'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '03-arkanoid': dynamic(() => import('@/juegos/03-arkanoid'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '05-tetris': dynamic(() => import('@/juegos/05-tetris'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '06-snake': dynamic(() => import('@/juegos/06-snake'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '07-pong': dynamic(() => import('@/juegos/07-pong'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '08-invaders': dynamic(() => import('@/juegos/08-invaders'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '09-vuelo-rasante': dynamic(() => import('@/juegos/09-vuelo-rasante'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '10-simon': dynamic(() => import('@/juegos/10-simon'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '11-campo-minado': dynamic(() => import('@/juegos/11-campo-minado'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '12-fusion': dynamic(() => import('@/juegos/12-fusion'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '13-rompecabezas': dynamic(() => import('@/juegos/13-rompecabezas'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '14-asteroides': dynamic(() => import('@/juegos/14-asteroides'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '15-cruce': dynamic(() => import('@/juegos/15-cruce'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '16-cuatro-en-linea': dynamic(() => import('@/juegos/16-cuatro-en-linea'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '17-tanques': dynamic(() => import('@/juegos/17-tanques'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '18-filo-de-sombra': dynamic(() => import('@/juegos/18-filo-de-sombra'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '19-fuera-de-combate': dynamic(() => import('@/juegos/19-fuera-de-combate'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
  '35-fontanero': dynamic(() => import('@/juegos/35-fontanero'), {
    ssr: false,
    loading: () => <PantallaDeCarga />,
  }),
};

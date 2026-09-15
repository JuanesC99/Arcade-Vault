'use client';

/* Cabina 05-tetris. Junta las tres piezas: estilos, panel y motor.
   Generado por herramientas/convertir-cabinas.mjs */

import Cabina from '@/componentes/Cabina';
import Marcado from './marcado';
import { iniciar, MANDO } from './motor';
import './estilos.css';

export default function CabinaJuego() {
  return (
    <Cabina carpeta="05-tetris" iniciar={iniciar} mando={MANDO}>
      <Marcado />
    </Cabina>
  );
}

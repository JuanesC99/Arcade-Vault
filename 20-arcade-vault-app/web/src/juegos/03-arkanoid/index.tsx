'use client';

/* Cabina 03-arkanoid. Junta las tres piezas: estilos, panel y motor.
   Generado por herramientas/convertir-cabinas.mjs */

import Cabina from '@/componentes/Cabina';
import Marcado from './marcado';
import { iniciar, MANDO } from './motor';
import './estilos.css';

export default function CabinaJuego() {
  return (
    <Cabina carpeta="03-arkanoid" iniciar={iniciar} mando={MANDO}>
      <Marcado />
    </Cabina>
  );
}

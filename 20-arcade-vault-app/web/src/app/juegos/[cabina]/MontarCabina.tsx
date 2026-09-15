'use client';

/**
 * Puente entre la ruta y el registro de cabinas: elige el componente que
 * toca y lo envuelve en la sesión, que es lo que necesita el marcador.
 */

import { ProveedorSesion } from '@/lib/sesion';
import { CABINAS_MONTABLES } from '@/juegos/registro';

export default function MontarCabina({ carpeta }: { carpeta: string }) {
  const Juego = CABINAS_MONTABLES[carpeta];
  if (!Juego) return <p className="cargando-cabina">Esa cabina no está en el salón.</p>;

  return (
    <ProveedorSesion>
      <Juego />
    </ProveedorSesion>
  );
}

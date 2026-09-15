import BarraSalon from '@/componentes/BarraSalon';
import { ProveedorSesion } from '@/lib/sesion';
import '@/estilos/salon.css';

/**
 * Marco de las páginas del salón. Los estilos del salón se importan aquí y
 * no en la raíz, para que las cabinas no hereden nada.
 */
export default function LayoutSalon({ children }: { children: React.ReactNode }) {
  return (
    <ProveedorSesion>
      <div className="grain" />
      <div className="horizon" />
      <BarraSalon />
      {children}
      <footer>
        <a className="logo" href="#inicio">
          ARCADE<span>VAULT</span>
        </a>
        <p>SALÓN LOCAL · 18 CABINAS EN NEXT.JS · MARCADOR EN NEST.JS · 2026</p>
      </footer>
    </ProveedorSesion>
  );
}

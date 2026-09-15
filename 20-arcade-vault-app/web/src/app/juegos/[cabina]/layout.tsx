import '@/estilos/cabina.css';

/**
 * Las cabinas no heredan los estilos del salón: cada juego trae los suyos y
 * aquí solo va lo mínimo que comparten todas.
 */
export default function LayoutCabina({ children }: { children: React.ReactNode }) {
  return children;
}

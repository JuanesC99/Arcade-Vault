import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Press_Start_2P } from 'next/font/google';
import './reinicio.css';

/**
 * Raíz de la aplicación. A propósito no trae estilos del salón: las cabinas
 * cuelgan de aquí con su propia hoja y no deben heredar nada que las pise.
 */

const pixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--pixel-fuente',
});

const cuerpo = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--body-fuente',
});

export const metadata: Metadata = {
  title: 'Arcade Vault',
  description:
    'Dieciocho cabinas arcade hechas a mano, con salón de la fama compartido.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>🕹️</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: '#07060d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${pixel.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MontarCabina from './MontarCabina';
import { CABINAS, buscarCabina } from '@/lib/catalogo';

/** Una ruta por cabina, generadas de una vez desde el catálogo. */
export function generateStaticParams() {
  return CABINAS.map((c) => ({ cabina: c.carpeta }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cabina: string }>;
}): Promise<Metadata> {
  const { cabina } = await params;
  const ficha = buscarCabina(cabina);
  if (!ficha) return { title: 'Cabina desconocida · Arcade Vault' };
  return {
    title: `${ficha.titulo} · Arcade Vault`,
    description: ficha.descripcion,
  };
}

export default async function PaginaCabina({
  params,
}: {
  params: Promise<{ cabina: string }>;
}) {
  const { cabina } = await params;
  if (!buscarCabina(cabina)) notFound();
  return <MontarCabina carpeta={cabina} />;
}

'use client';

/**
 * El salón de la fama, ahora compartido: las marcas salen del servidor, así
 * que se ven las de todo el mundo y no solo las de este navegador.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ErrorApi, type CabinaDelHall } from '@/lib/api';
import { buscarCabina, CABINAS } from '@/lib/catalogo';
import { marcasDeInvitado, type MarcaInvitado } from '@/lib/marcador';
import { useSesion } from '@/lib/sesion';

function Fila({
  puesto,
  quien,
  cuanto,
  extra,
}: {
  puesto: number;
  quien: string;
  cuanto: string;
  extra?: string;
}) {
  return (
    <div className="hof-fila">
      <span className={`pos${puesto === 1 ? ' oro' : ''}`}>{puesto}</span>
      <span className="quien">{quien}</span>
      <span className="cuanto">{cuanto}</span>
      {extra ? <span className="extra">{extra}</span> : null}
    </div>
  );
}

export default function SalonDeLaFama() {
  const { jugador, token, refrescar } = useSesion();
  const [hall, setHall] = useState<CabinaDelHall[]>([]);
  const [invitado, setInvitado] = useState<MarcaInvitado[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [alias, setAlias] = useState('');

  const cargar = useCallback(() => {
    api
      .hall()
      .then((datos) => {
        setHall(datos);
        setAviso(null);
      })
      .catch((e: unknown) => {
        setHall([]);
        setAviso(
          e instanceof ErrorApi && e.estado === 0
            ? 'El servidor del salón no responde, así que aquí solo se ven tus partidas de invitado. Arranca la API y recarga.'
            : 'No se pudieron leer las marcas.',
        );
      });
  }, []);

  useEffect(() => {
    cargar();
    setInvitado(marcasDeInvitado());
  }, [cargar]);

  useEffect(() => {
    setAlias(jugador?.alias ?? '');
  }, [jugador]);

  async function guardarAlias() {
    if (!token || !alias.trim()) return;
    try {
      refrescar(await api.cambiarAlias(token, alias));
      cargar();
    } catch {
      setAviso('No se pudo cambiar el alias.');
    }
  }

  const porJuego = new Map(hall.map((c) => [c.juego, c]));

  return (
    <section className="hof" id="hall">
      <p className="eyebrow">SALÓN DE LA FAMA</p>

      {aviso && <div className="hof-aviso">{aviso}</div>}

      <div className="hof-cabecera">
        <div className="campo">
          <label htmlFor="alias">Firmas tus marcas como</label>
          <input
            id="alias"
            maxLength={12}
            spellCheck={false}
            autoComplete="off"
            value={alias}
            disabled={!jugador}
            placeholder={jugador ? '' : 'INVITADO'}
            onChange={(e) => setAlias(e.target.value)}
            onBlur={guardarAlias}
          />
          <small>
            {jugador ? (
              <>
                Alias de tu cuenta @{jugador.usuario}. <Link href="/acceso">Gestionar</Link>
              </>
            ) : (
              <>
                Juegas de invitado y tus marcas no salen aquí.{' '}
                <Link href="/acceso">Crea una cuenta</Link> para subirlas.
              </>
            )}
          </small>
        </div>
      </div>

      <div className="hof-grid">
        {CABINAS.map((cabina) => {
          const ficha = porJuego.get(cabina.carpeta);
          const marcas = ficha?.marcas ?? [];
          const unidad = ficha?.unidad ?? '';
          return (
            <article className="hof-card" key={cabina.carpeta}>
              <h4>{cabina.titulo}</h4>
              <p className="que">
                {marcas.length
                  ? ficha!.menorEsMejor
                    ? 'menor es mejor'
                    : 'mayor es mejor'
                  : cabina.genero}
              </p>
              {marcas.length ? (
                marcas.map((m, i) => (
                  <Fila
                    key={m.id}
                    puesto={i + 1}
                    quien={m.alias}
                    cuanto={`${m.valor}${unidad ? ' ' + unidad : ''}`}
                    extra={m.etiqueta ? `${m.etiqueta} · ${m.creada.slice(0, 10)}` : undefined}
                  />
                ))
              ) : (
                <p className="hof-vacio">Sin marcas todavía. Juega una partida.</p>
              )}
            </article>
          );
        })}
      </div>

      {invitado.length > 0 && (
        <div className="hof-card" style={{ marginTop: 18 }}>
          <h4>TUS PARTIDAS DE INVITADO</h4>
          <p className="que">guardadas solo en este navegador</p>
          {invitado.slice(0, 5).map((m, i) => (
            <Fila
              key={`${m.juego}-${m.creada}-${i}`}
              puesto={i + 1}
              quien={buscarCabina(m.juego)?.titulo ?? m.juego}
              cuanto={`${m.valor} ${m.unidad}`}
              extra={m.creada.slice(0, 10)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

/**
 * Entrar, crear cuenta y gestionar la que ya tienes.
 * Todo pasa por la API: aquí no se guarda ninguna contraseña.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ErrorApi } from '@/lib/api';
import { useSesion } from '@/lib/sesion';
import '@/estilos/acceso.css';

type Aviso = { texto: string; bien: boolean } | null;

function CajaAviso({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null;
  return <div className={`aviso ver ${aviso.bien ? 'bien' : 'mal'}`}>{aviso.texto}</div>;
}

function mensajeDe(e: unknown): string {
  return e instanceof ErrorApi ? e.message : 'Algo falló en el salón.';
}

export default function Acceso() {
  const { jugador, token, cargando, entrar, registrar, salir, refrescar } = useSesion();

  const [pestana, setPestana] = useState<'entrar' | 'crear'>('entrar');
  const [aviso, setAviso] = useState<Aviso>(null);
  const [avisoSesion, setAvisoSesion] = useState<Aviso>(null);
  const [trabajando, setTrabajando] = useState(false);

  const [eUsuario, setEUsuario] = useState('');
  const [eClave, setEClave] = useState('');

  const [cUsuario, setCUsuario] = useState('');
  const [cAlias, setCAlias] = useState('');
  const [cClave, setCClave] = useState('');
  const [cClave2, setCClave2] = useState('');

  const [alias, setAlias] = useState('');
  const [pActual, setPActual] = useState('');
  const [pNueva, setPNueva] = useState('');
  const [pNueva2, setPNueva2] = useState('');
  const [bClave, setBClave] = useState('');

  useEffect(() => {
    setAlias(jugador?.alias ?? '');
  }, [jugador]);

  async function alEntrar(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    setTrabajando(true);
    try {
      await entrar(eUsuario, eClave);
      setEClave('');
      setAvisoSesion({ texto: 'Dentro. A jugar.', bien: true });
    } catch (error) {
      setAviso({ texto: mensajeDe(error), bien: false });
      setEClave('');
    } finally {
      setTrabajando(false);
    }
  }

  async function alCrear(e: React.FormEvent) {
    e.preventDefault();
    setAviso(null);
    if (cClave !== cClave2) {
      setAviso({ texto: 'Las dos contraseñas no coinciden.', bien: false });
      return;
    }
    setTrabajando(true);
    try {
      await registrar(cUsuario, cAlias, cClave);
      setCUsuario('');
      setCAlias('');
      setCClave('');
      setCClave2('');
      setAvisoSesion({ texto: 'Cuenta creada. Ya puedes dejar marcas.', bien: true });
    } catch (error) {
      setAviso({ texto: mensajeDe(error), bien: false });
    } finally {
      setTrabajando(false);
    }
  }

  async function alGuardarAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const nuevo = await api.cambiarAlias(token, alias);
      refrescar(nuevo);
      setAvisoSesion({ texto: `Ahora firmas como ${nuevo.alias}.`, bien: true });
    } catch (error) {
      setAvisoSesion({ texto: mensajeDe(error), bien: false });
    }
  }

  async function alCambiarClave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (pNueva !== pNueva2) {
      setAvisoSesion({ texto: 'Las dos contraseñas nuevas no coinciden.', bien: false });
      return;
    }
    try {
      await api.cambiarClave(token, pActual, pNueva);
      setPActual('');
      setPNueva('');
      setPNueva2('');
      setAvisoSesion({ texto: 'Contraseña cambiada.', bien: true });
    } catch (error) {
      setAvisoSesion({ texto: mensajeDe(error), bien: false });
    }
  }

  async function alBorrar(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !jugador) return;
    try {
      await api.borrarCuenta(token, jugador.usuario, bClave);
      setBClave('');
      salir();
      setAviso({ texto: 'Cuenta borrada.', bien: true });
    } catch (error) {
      setAvisoSesion({ texto: mensajeDe(error), bien: false });
    }
  }

  if (cargando) {
    return (
      <div className="acceso">
        <div className="caja">
          <h1>COMPROBANDO FICHA…</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="acceso">
      {!jugador && (
        <div className="caja">
          <div className="pestanas">
            <button
              type="button"
              className={pestana === 'entrar' ? 'on' : undefined}
              onClick={() => {
                setPestana('entrar');
                setAviso(null);
              }}
            >
              ENTRAR
            </button>
            <button
              type="button"
              className={pestana === 'crear' ? 'on' : undefined}
              onClick={() => {
                setPestana('crear');
                setAviso(null);
              }}
            >
              CREAR CUENTA
            </button>
          </div>

          <CajaAviso aviso={aviso} />

          {pestana === 'entrar' ? (
            <form onSubmit={alEntrar} autoComplete="off">
              <h1>INSERTA TU FICHA</h1>
              <p className="sub">Entra para que tus marcas lleven tu nombre.</p>

              <div className="campo">
                <label htmlFor="eUsuario">Usuario</label>
                <input
                  id="eUsuario"
                  type="text"
                  maxLength={16}
                  spellCheck={false}
                  autoComplete="username"
                  value={eUsuario}
                  onChange={(e) => setEUsuario(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="eClave">Contraseña</label>
                <input
                  id="eClave"
                  type="password"
                  maxLength={72}
                  autoComplete="current-password"
                  value={eClave}
                  onChange={(e) => setEClave(e.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={trabajando}>
                {trabajando ? 'COMPROBANDO…' : 'ENTRAR AL SALÓN'}
              </button>
            </form>
          ) : (
            <form onSubmit={alCrear} autoComplete="off">
              <h1>NUEVA FICHA</h1>
              <p className="sub">Un usuario para entrar y un alias corto para el marcador.</p>

              <div className="campo">
                <label htmlFor="cUsuario">Usuario</label>
                <input
                  id="cUsuario"
                  type="text"
                  maxLength={16}
                  spellCheck={false}
                  autoComplete="username"
                  value={cUsuario}
                  onChange={(e) => setCUsuario(e.target.value)}
                />
                <p className="pista">
                  De 3 a 16 caracteres: letras, números, punto, guion y guion bajo.
                </p>
              </div>
              <div className="campo">
                <label htmlFor="cAlias">Alias en el marcador</label>
                <input
                  id="cAlias"
                  type="text"
                  maxLength={12}
                  spellCheck={false}
                  autoComplete="off"
                  value={cAlias}
                  onChange={(e) => setCAlias(e.target.value)}
                />
                <p className="pista">Hasta 12 caracteres. Vacío usa tu usuario.</p>
              </div>
              <div className="campo">
                <label htmlFor="cClave">Contraseña</label>
                <input
                  id="cClave"
                  type="password"
                  maxLength={72}
                  autoComplete="new-password"
                  value={cClave}
                  onChange={(e) => setCClave(e.target.value)}
                />
                <p className="pista">Mínimo 6 caracteres. No reutilices una de otro sitio.</p>
              </div>
              <div className="campo">
                <label htmlFor="cClave2">Repite la contraseña</label>
                <input
                  id="cClave2"
                  type="password"
                  maxLength={72}
                  autoComplete="new-password"
                  value={cClave2}
                  onChange={(e) => setCClave2(e.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={trabajando}>
                {trabajando ? 'CREANDO…' : 'CREAR CUENTA'}
              </button>
            </form>
          )}
        </div>
      )}

      {jugador && (
        <div className="caja">
          <h1>SESIÓN ABIERTA</h1>
          <p className="sub">Tus partidas se firman con este alias.</p>

          <CajaAviso aviso={avisoSesion} />

          <div className="sesion-datos">
            <div className="quien">{jugador.alias}</div>
            <div className="usuario">@{jugador.usuario}</div>
          </div>

          <div className="fila-botones">
            <Link className="btn" href="/" style={{ textAlign: 'center', textDecoration: 'none', lineHeight: 1.4 }}>
              IR AL SALÓN
            </Link>
            <button className="btn suave" type="button" onClick={salir}>
              CERRAR SESIÓN
            </button>
          </div>

          <details className="plegable">
            <summary>CAMBIAR ALIAS</summary>
            <div className="cuerpo">
              <form onSubmit={alGuardarAlias} autoComplete="off">
                <div className="campo">
                  <label htmlFor="aAlias">Alias nuevo</label>
                  <input
                    id="aAlias"
                    type="text"
                    maxLength={12}
                    spellCheck={false}
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </div>
                <button className="btn suave" type="submit">
                  GUARDAR ALIAS
                </button>
              </form>
            </div>
          </details>

          <details className="plegable">
            <summary>CAMBIAR CONTRASEÑA</summary>
            <div className="cuerpo">
              <form onSubmit={alCambiarClave} autoComplete="off">
                <div className="campo">
                  <label htmlFor="pActual">Contraseña actual</label>
                  <input
                    id="pActual"
                    type="password"
                    maxLength={72}
                    autoComplete="current-password"
                    value={pActual}
                    onChange={(e) => setPActual(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="pNueva">Contraseña nueva</label>
                  <input
                    id="pNueva"
                    type="password"
                    maxLength={72}
                    autoComplete="new-password"
                    value={pNueva}
                    onChange={(e) => setPNueva(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="pNueva2">Repite la nueva</label>
                  <input
                    id="pNueva2"
                    type="password"
                    maxLength={72}
                    autoComplete="new-password"
                    value={pNueva2}
                    onChange={(e) => setPNueva2(e.target.value)}
                  />
                </div>
                <button className="btn suave" type="submit">
                  GUARDAR CONTRASEÑA
                </button>
              </form>
            </div>
          </details>

          <details className="plegable">
            <summary>BORRAR LA CUENTA</summary>
            <div className="cuerpo">
              <form onSubmit={alBorrar} autoComplete="off">
                <p className="pista" style={{ marginBottom: 12 }}>
                  Se borra la cuenta y con ella todas tus marcas del salón de la fama.
                </p>
                <div className="campo">
                  <label htmlFor="bClave">Confirma con tu contraseña</label>
                  <input
                    id="bClave"
                    type="password"
                    maxLength={72}
                    autoComplete="current-password"
                    value={bClave}
                    onChange={(e) => setBClave(e.target.value)}
                  />
                </div>
                <button className="btn peligro" type="submit">
                  BORRAR CUENTA
                </button>
              </form>
            </div>
          </details>
        </div>
      )}

      <p className="nota">
        <b>Las cuentas viven en el servidor del salón.</b> La contraseña se guarda
        cifrada con bcrypt y la sesión viaja en un token firmado. Es una API de andar
        por casa sobre SQLite: vale para jugar en tu red, no para guardar nada de
        valor.
      </p>

      <Link className="volver" href="/">
        &lt; VOLVER AL SALÓN
      </Link>
    </div>
  );
}

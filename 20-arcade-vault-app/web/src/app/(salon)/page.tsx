import Link from 'next/link';
import Biblioteca from '@/componentes/Biblioteca';
import Destacado from '@/componentes/Destacado';
import Munecos, { Vecino } from '@/componentes/Munecos';
import SalonDeLaFama from '@/componentes/SalonDeLaFama';
import { CABINAS } from '@/lib/catalogo';

export default function Portada() {
  return (
    <main className="wrap">
      <section className="portada" id="inicio">
        <Munecos />
        <div className="portada-texto">
          <h1 className="marca">
            EL SALÓN
            <br />
            NUNCA <em>CIERRA</em>
          </h1>
          <p className="lema">
            Dieciocho cabinas encendidas, todas hechas a mano y ahora servidas con
            React.
          </p>
          <p className="letra-chica">
            Los juegos corren en tu navegador; el marcador vive en el servidor del
            salón. Entra con tu ficha y tus partidas salen en el salón de la fama de
            todos.
          </p>
          <div className="portada-botones">
            <Link className="btn" href="#biblioteca">
              VER LA BIBLIOTECA
            </Link>
            <Link className="btn secundario" href="#hall">
              SALÓN DE LA FAMA
            </Link>
          </div>
        </div>
        <div className="contadores">
          <div className="contador">
            <b>{CABINAS.length}</b>
            <span>Cabinas</span>
          </div>
          <div className="contador">
            <b>0</b>
            <span>Instalaciones</span>
          </div>
          <div className="contador">
            <b>100%</b>
            <span>TypeScript</span>
          </div>
          <div className="contador">
            <b>24/7</b>
            <span>Abierto</span>
          </div>
        </div>
      </section>

      <Destacado />
      <Biblioteca />
      <SalonDeLaFama />

      <section className="acerca" id="acerca">
        <p className="eyebrow">ACERCA DE</p>
        <div className="acerca-caja">
          <div>
            <h3>
              UN SALÓN QUE CABE
              <br />
              EN UNA CARPETA
            </h3>
            <p>
              Arcade Vault reúne dieciocho cabinas escritas desde cero. Nacieron como
              páginas sueltas de HTML, CSS y JavaScript, y hoy viven dentro de una
              aplicación de Next.js sin haber perdido una línea de su lógica:{' '}
              <b>cada juego se envuelve, no se reescribe</b>.
            </p>
            <p>
              El salón reparte las cabinas por género, presta a todas el mismo mando
              táctil y el mismo botón de pantalla completa, y lleva la cuenta de las
              mejores partidas.
            </p>
            <p>
              Las cuentas y las marcas ya no viven en el navegador:{' '}
              <b>las guarda un servicio de Nest.js sobre SQLite</b>, con la contraseña
              cifrada en el servidor y la sesión firmada con un token.
            </p>
          </div>
          <div>
            <dl className="fichas-tecnicas">
              <div className="ficha-tec">
                <dt>Cabinas</dt>
                <dd>{CABINAS.length}</dd>
              </div>
              <div className="ficha-tec">
                <dt>Salón</dt>
                <dd>NEXT.JS · REACT</dd>
              </div>
              <div className="ficha-tec">
                <dt>Marcador</dt>
                <dd>NEST.JS · PRISMA</dd>
              </div>
              <div className="ficha-tec">
                <dt>Base de datos</dt>
                <dd>SQLITE</dd>
              </div>
              <div className="ficha-tec">
                <dt>Sesión</dt>
                <dd>TOKEN JWT</dd>
              </div>
              <div className="ficha-tec">
                <dt>Mando</dt>
                <dd>TECLADO Y TÁCTIL</dd>
              </div>
            </dl>
            <p className="acerca-firma">
              <span className="sello" aria-hidden="true">
                <Vecino quien="marciano" />
              </span>
              Hecho a mano en 01-firstcode. Pulsa P para pausar en cualquier cabina.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* El panel y el lienzo de la cabina 18-filo-de-sombra, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>FILO DE SOMBRA</h1>
        <div className="stage">
          <canvas id="cv" width="640" height="480"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">FILO DE SOMBRA</p>
            <small id="overText">Trepa por los muros, corta lo que se mueva<br />y llega a la puerta antes de que se acabe el tiempo</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>ACTO</h2><div className="val chico" id="acto">1</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="vidas">3</div></div>
        <div className="box"><h2>ARTE NINJA</h2><div className="val chico" id="arte">Ninguna</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← →</b> correr · <b>↓</b> agacharse<br />
            <b>Espacio</b> saltar<br />
            <b>Z</b> espada · <b>X</b> arte ninja<br />
            <b>P</b> pausa · <b>F</b> pantalla · <b>M</b> sonido
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>EL MURO</h2>
          <div className="keys">En el aire, contra una pared, Ryu se agarra. Salta desde ahí y vuelve a pegarte al muro para subir a saltos. Media partida se gana trepando.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

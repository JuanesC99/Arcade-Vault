/* El panel y el lienzo de la cabina 03-arkanoid, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>ARKANOID</h1>
        <div className="stage">
          <canvas id="game" width="800" height="600"></canvas>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>RÉCORD</h2><div className="val" id="best">0</div></div>
        <div className="box"><h2>NIVEL</h2><div className="val" id="level">1/10</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="lives">3</div></div>
        <div className="box"><h2>CONTINUES</h2><div className="val" id="continues">3</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Ratón</b> mueve la pala<br />
            <b>← →</b> también<br />
            <b>P</b> pausa y saltar nivel
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">
            Diez pantallas con bloques que aguantan hasta tres golpes. Del techo caen cápsulas: <b>M</b> parte la bola en tres, <b>V</b> da una vida.
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

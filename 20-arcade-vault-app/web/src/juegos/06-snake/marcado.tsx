/* El panel y el lienzo de la cabina 06-snake, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>CABLE SUELTO</h1>
        <div className="stage">
          <canvas id="cv" width="560" height="560"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">CABLE SUELTO</p>
            <small id="overText">Recoge chispas sin morderte la cola</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>RÉCORD</h2><div className="val" id="best">0</div></div>
        <div className="box"><h2>LARGO</h2><div className="val" id="len">3</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← ↑ → ↓</b> girar<br />
            <b>W A S D</b> también<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">
            Chocar con el muro o contigo termina la partida. Cada chispa alarga el cable y acelera un poco.
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

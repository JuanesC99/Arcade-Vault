/* El panel y el lienzo de la cabina 08-invaders, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>LLUVIA DE MARCIANOS</h1>
        <div className="stage">
          <canvas id="cv" width="640" height="560"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">LLUVIA DE MARCIANOS</p>
            <small id="overText">Bájalos a todos antes de que lleguen abajo</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>OLEADA</h2><div className="val" id="wave">1</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="lives">3</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← →</b> mover<br />
            <b>Espacio</b> disparar<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">Los búnkeres se desgastan con cada impacto. Cada oleada baja más rápido y dispara más.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

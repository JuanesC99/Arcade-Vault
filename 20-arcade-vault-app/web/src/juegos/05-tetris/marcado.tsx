/* El panel y el lienzo de la cabina 05-tetris, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>BLOQUES DE BOLSILLO</h1>
        <div className="stage">
          <canvas id="board" width="300" height="600"></canvas>
          <div className="overlay" id="over">
            <p id="overTitle">PAUSA</p>
            <small id="overText">Pulsa P para seguir</small>
            <button id="overBtn" style={{ "display": "none" }}>OTRA PARTIDA</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>LÍNEAS</h2><div className="val" id="lines">0</div></div>
        <div className="box"><h2>NIVEL</h2><div className="val" id="level">1</div></div>
        <div className="box"><h2>SIGUIENTE</h2><canvas id="next" width="120" height="120"></canvas></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← →</b> mover<br />
            <b>↑</b> girar<br />
            <b>↓</b> bajar rápido<br />
            <b>Espacio</b> soltar<br />
            <b>P</b> pausa
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

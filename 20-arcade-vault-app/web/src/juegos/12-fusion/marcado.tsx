/* El panel y el lienzo de la cabina 12-fusion, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>FUSIÓN 2048</h1>
        <div className="stage">
          <div id="rejilla"></div>
          <div className="overlay" id="over">
            <p id="overTitle">SIN MOVIMIENTOS</p>
            <small id="overText"></small>
            <button id="overBtn">OTRA PARTIDA</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>RÉCORD</h2><div className="val" id="best">0</div></div>
        <div className="box"><h2>MAYOR FICHA</h2><div className="val" id="max">2</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Arrastra</b> con el ratón<br />
            <b>← ↑ → ↓</b> mover<br />
            <b>W A S D</b> también<br />
            <b>R</b> nueva partida
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">Dos fichas iguales se funden en una del doble. Llega a 2048 y puedes seguir jugando.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

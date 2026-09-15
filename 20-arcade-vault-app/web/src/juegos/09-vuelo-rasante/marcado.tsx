/* El panel y el lienzo de la cabina 09-vuelo-rasante, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>VUELO RASANTE</h1>
        <div className="stage">
          <canvas id="cv" width="480" height="620"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">VUELO RASANTE</p>
            <small id="overText">Un toque sube, la gravedad hace el resto</small>
            <button id="overBtn">DESPEGAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUERTAS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>RÉCORD</h2><div className="val" id="best">0</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Espacio</b> o <b>clic</b> impulso<br />
            <b>↑</b> también<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">Pasa entre las torres. El hueco se estrecha cada cinco puertas y la nave acelera.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

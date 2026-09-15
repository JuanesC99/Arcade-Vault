/* El panel y el lienzo de la cabina 15-cruce, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>CRUCE PELIGROSO</h1>
        <div className="stage">
          <canvas id="cv" width="616" height="616"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">CRUCE PELIGROSO</p>
            <small id="overText">Cruza el tráfico y el río hasta las cinco casillas de arriba</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>CASAS</h2><div className="val" id="casas">0 / 5</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="vidas">3</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← ↑ → ↓</b> saltar<br />
            <b>W A S D</b> también<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">En el agua solo se sobrevive encima de un tronco. Cada casa ocupada da 50 puntos y te devuelve al inicio.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

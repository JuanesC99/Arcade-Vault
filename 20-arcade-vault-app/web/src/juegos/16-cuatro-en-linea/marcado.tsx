/* El panel y el lienzo de la cabina 16-cuatro-en-linea, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>CUATRO EN LÍNEA</h1>
        <div className="stage">
          <canvas id="cv" width="560" height="560"></canvas>
          <div className="overlay" id="over">
            <p id="overTitle">GANASTE</p>
            <small id="overText"></small>
            <button id="overBtn">OTRA PARTIDA</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box">
          <h2>TURNO</h2>
          <div className="turno" id="turno"><span className="punto p1"></span><span id="turnoTexto">Tú</span></div>
        </div>
        <div className="box"><h2>FICHAS PUESTAS</h2><div className="val" id="fichas">0</div></div>
        <div className="box"><h2>GANADAS</h2><div className="val" id="ganadas">0</div></div>
        <div className="box ancho">
          <h2>RIVAL</h2>
          <div className="fila" id="rival">
            <button data-r="maquina" className="on">Máquina</button>
            <button data-r="humano">2 jugadores</button>
          </div>
        </div>
        <div className="box ancho">
          <h2>DIFICULTAD</h2>
          <div className="fila" id="nivel">
            <button data-n="2">Fácil</button>
            <button data-n="4" className="on">Normal</button>
            <button data-n="6">Duro</button>
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Clic</b> en una columna<br />
            <b>1 a 7</b> también<br />
            <b>R</b> nueva partida
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

/* El panel y el lienzo de la cabina 07-pong, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>DUELO DE PALAS</h1>
        <div className="stage">
          <canvas id="cv" width="720" height="480"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">DUELO DE PALAS</p>
            <small id="overText">Primero en llegar a 7 gana</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>TÚ</h2><div className="val" id="p1">0</div></div>
        <div className="box ancho"><h2>RIVAL</h2><div className="val" id="p2">0</div></div>
        <div className="box"><h2>PELOTEO MÁS LARGO</h2><div className="val" id="rally">0</div></div>
        <div className="box ancho">
          <h2>MODO</h2>
          <div className="modo">
            <button id="m1" className="on">1 JUGADOR</button>
            <button id="m2">2 JUGADORES</button>
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Ratón</b> o <b>↑ ↓</b> pala izquierda<br />
            <b>W S</b> pala derecha en dos jugadores<br />
            <b>P</b> pausa
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

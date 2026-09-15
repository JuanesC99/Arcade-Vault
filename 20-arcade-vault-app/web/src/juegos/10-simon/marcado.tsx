/* El panel y el lienzo de la cabina 10-simon, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>MEMORIA NEÓN</h1>
        <div className="stage">
          <div className="pad">
            <div className="tecla" id="t0" data-i="0"><span>Q</span></div>
            <div className="tecla" id="t1" data-i="1"><span>W</span></div>
            <div className="tecla" id="t2" data-i="2"><span>A</span></div>
            <div className="tecla" id="t3" data-i="3"><span>S</span></div>
          </div>
          <div className="centro"><b id="ronda">0</b><small id="fase">Listo</small></div>
          <div className="overlay show" id="over">
            <p id="overTitle">MEMORIA NEÓN</p>
            <small id="overText">Repite la secuencia. Cada ronda añade una luz</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>RONDA</h2><div className="val" id="rondaLat">0</div></div>
        <div className="box"><h2>RÉCORD</h2><div className="val" id="best">0</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Clic</b> en las luces<br />
            <b>Q W A S</b> también<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">La secuencia crece una luz por ronda y se reproduce más rápido. Un fallo termina la partida.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

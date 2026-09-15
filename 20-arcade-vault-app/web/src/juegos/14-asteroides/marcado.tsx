/* El panel y el lienzo de la cabina 14-asteroides, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>CHATARRA ESPACIAL</h1>
        <div className="stage">
          <canvas id="cv" width="720" height="560"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">CHATARRA ESPACIAL</p>
            <small id="overText">Rompe las rocas. Las grandes se parten en pequeñas</small>
            <button id="overBtn">DESPEGAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>OLEADA</h2><div className="val" id="wave">1</div></div>
        <div className="box"><h2>NAVES</h2><div className="val" id="lives">3</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← →</b> girar<br />
            <b>↑</b> empuje<br />
            <b>Espacio</b> disparar<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">La nave no frena sola, solo pierde inercia poco a poco. Los bordes de la pantalla dan la vuelta.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

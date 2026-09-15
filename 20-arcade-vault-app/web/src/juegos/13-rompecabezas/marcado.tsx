/* El panel y el lienzo de la cabina 13-rompecabezas, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>PIEZAS SUELTAS</h1>
        <div className="stage" id="stage">
          <div id="tablero"></div>
          <div id="original"></div>
          <div className="overlay" id="over">
            <p id="overTitle">ARMADO</p>
            <small id="overText"></small>
            <button id="overBtn">OTRO CUADRO</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>MOVIMIENTOS</h2><div className="val" id="movs">0</div></div>
        <div className="box"><h2>TIEMPO</h2><div className="val" id="tiempo">0</div></div>
        <div className="box"><h2>EN SU SITIO</h2><div className="val" id="encajadas">0</div></div>
        <div className="box ancho">
          <h2>TAMAÑO</h2>
          <div className="fila" id="tamanos">
            <button data-n="3">3×3</button>
            <button data-n="4" className="on">4×4</button>
            <button data-n="5">5×5</button>
          </div>
        </div>
        <div className="box ancho">
          <h2>CUADRO</h2>
          <div className="fila" id="cuadros">
            <button data-c="0" className="on">1</button>
            <button data-c="1">2</button>
            <button data-c="2">3</button>
          </div>
        </div>
        <div className="box"><button id="verOriginal">VER ORIGINAL</button></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Arrastra</b> una pieza sobre otra<br />
            <b>Espacio</b> ver el original<br />
            <b>R</b> barajar de nuevo
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

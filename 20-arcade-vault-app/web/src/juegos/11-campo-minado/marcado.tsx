/* El panel y el lienzo de la cabina 11-campo-minado, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>CAMPO MINADO</h1>
        <div className="stage">
          <div id="tablero"></div>
          <div className="overlay" id="over">
            <p id="overTitle">BOOM</p>
            <small id="overText"></small>
            <button id="overBtn">OTRA PARTIDA</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>MINAS</h2><div className="val" id="minas">0</div></div>
        <div className="box"><h2>TIEMPO</h2><div className="val" id="tiempo">0</div></div>
        <div className="box ancho">
          <h2>DIFICULTAD</h2>
          <div className="niveles">
            <button data-n="facil" className="on">Fácil</button>
            <button data-n="medio">Medio</button>
            <button data-n="duro">Duro</button>
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Clic</b> descubrir<br />
            <b>Clic derecho</b> bandera<br />
            <b>R</b> nueva partida
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">La primera casilla nunca es mina. El número dice cuántas minas tocan esa casilla.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

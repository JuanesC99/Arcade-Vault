/* El panel y el lienzo de la cabina 17-tanques, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>BRIGADA ACORAZADA</h1>
        <div className="stage">
          <canvas id="cv" width="520" height="520"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">BRIGADA ACORAZADA</p>
            <small id="overText">Defiende el águila y limpia las veinte patrullas</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>FASE</h2><div className="val" id="fase">1</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="vidas">3</div></div>
        <div className="box"><h2>ENEMIGOS</h2><div className="val" id="quedan">20</div></div>
        <div className="box ancho">
          <h2>TU TANQUE</h2>
          <div className="grado" id="grado">Blindaje de serie</div>
        </div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>Flechas</b> o <b>WASD</b> mover<br />
            <b>Espacio</b> disparar<br />
            <b>P</b> pausa · <b>F</b> pantalla · <b>M</b> sonido
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">El ladrillo se rompe, el acero no hasta el tercer ascenso. El agua frena al tanque pero no a las balas, y bajo los árboles no te ven.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

/* El panel y el lienzo de la cabina 35-fontanero, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>MUNDO FONTANERO</h1>
        <div className="stage">
          <canvas id="cv" width="640" height="360"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">MUNDO FONTANERO</p>
            <small id="overText">Tres mundos, una gorra y muchas setas</small>
            <button id="overBtn">EMPEZAR</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>MONEDAS</h2><div className="val" id="coins">0</div></div>
        <div className="box"><h2>VIDAS</h2><div className="val" id="lives">3</div></div>
        <div className="box"><h2>MUNDO</h2><div className="val corto" id="world">PRADO 1-1</div></div>
        <div className="box"><h2>TIEMPO</h2><div className="val" id="time">320</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>&larr; &rarr;</b> correr<br />
            <b>Z</b> o <b>espacio</b> saltar<br />
            <b>X</b> salto giratorio<br />
            <b>P</b> pausa
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">
            La seta te hace grande y la pluma te da capa: cae con el salto pulsado y planeas. El salto giratorio rompe ladrillos. Pisa una coraza y patea el caparazón.
          </div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

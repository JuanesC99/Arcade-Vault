/* El panel y el lienzo de la cabina 19-fuera-de-combate, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1>FUERA DE COMBATE</h1>
        <div className="stage">
          <canvas id="cv" width="640" height="480"></canvas>
          <div className="overlay show" id="over">
            <p id="overTitle">FUERA DE COMBATE</p>
            <small id="overText">Cada rival avisa antes de pegar<br />Esquiva a tiempo y su hueco es tuyo</small>
            <button id="overBtn">SALIR AL RING</button>
          </div>
        </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="score">0</div></div>
        <div className="box"><h2>RIVAL</h2><div className="val chico" id="rival">1 de 3</div></div>
        <div className="box"><h2>ASALTO</h2><div className="val" id="ronda">1</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>← →</b> esquivar · <b>↓</b> agacharse<br />
            <b>Z</b> izquierda · <b>X</b> derecha<br />
            <b>↑</b> + golpe: a la cara<br />
            <b>Espacio</b> gancho de estrella<br />
            <b>P</b> pausa · <b>F</b> pantalla · <b>M</b> sonido
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>EL OFICIO</h2>
          <div className="keys">Quieto se cubre y tus golpes rebotan. Solo se abre justo después de fallar el suyo, y ahí es donde se gana. Esquivar da estrellas; sin aire no puedes pegar.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

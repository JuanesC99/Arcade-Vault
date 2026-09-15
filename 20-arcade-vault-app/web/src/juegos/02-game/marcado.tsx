/* El panel y el lienzo de la cabina 02-game, pasados a JSX.
   Los identificadores son los mismos que buscaba el juego original,
   así que el motor los encuentra sin cambiar una línea. */

export default function Marcado() {
  return (
    <>
      <div>
        <h1 className="cabina-titulo">METRO RUSH</h1>
      <div id="app">
        <canvas id="game"></canvas>

        {/* ---------------- HUD ---------------- */}
        <div id="hud" className="hidden">
          <div id="hud-mult" className="mult hidden">x2</div>
          <div id="hud-powers" className="powers"></div>

          <button id="btn-pause" className="icon-btn" aria-label="Pausa" title="Pausa (P)">II</button>
          <button id="btn-sound" className="icon-btn sound" aria-label="Sonido" title="Sonido (M)">♪</button>
        </div>

        {/* ---------------- MENÚ ---------------- */}
        <div id="screen-start" className="overlay">
          <div className="panel">
            <h1 className="logo"><span>METRO</span> RUSH</h1>
            <p className="tagline">Corre por las vías. No mires atrás.</p>

            <button id="btn-play" className="btn-main">JUGAR</button>
            <button id="btn-shop" className="btn-second">TIENDA</button>

            <div className="controls">
              <div className="ctrl"><kbd>←</kbd><kbd>→</kbd><span>Cambiar de carril</span></div>
              <div className="ctrl"><kbd>↑</kbd><kbd>Espacio</kbd><span>Saltar</span></div>
              <div className="ctrl"><kbd>↓</kbd><span>Deslizarse</span></div>
              <div className="ctrl touch-only"><span className="swipe">👆</span><span>Desliza en cualquier dirección</span></div>
            </div>

            <div className="legend">
              <div><i className="chip chip-coin"></i> Moneda</div>
              <div><i className="chip chip-magnet"></i> Imán</div>
              <div><i className="chip chip-shield"></i> Escudo</div>
              <div><i className="chip chip-boost"></i> Doble puntos</div>
              <div><i className="chip chip-jet"></i> Jetpack</div>
              <div><i className="chip chip-boots"></i> Súper zapatillas</div>
            </div>

            <p className="best">Récord: <b id="start-best">0</b> &nbsp;·&nbsp; Banco: <b id="start-bank">0</b> 🪙</p>
          </div>
        </div>

        {/* ---------------- TIENDA ---------------- */}
        <div id="screen-shop" className="overlay hidden">
          <div className="panel wide">
            <div className="shop-head">
              <h2>TIENDA</h2>
              <div className="bank"><b id="shop-bank">0</b> 🪙</div>
            </div>

            <div className="tabs">
              <button className="tab active" data-tab="chars">Personajes</button>
              <button className="tab" data-tab="ups">Mejoras</button>
            </div>

            <div id="tab-chars" className="tab-body"></div>
            <div id="tab-ups" className="tab-body hidden"></div>

            <button id="btn-shop-back" className="btn-ghost">VOLVER</button>
          </div>
        </div>

        {/* ---------------- PAUSA ---------------- */}
        <div id="screen-pause" className="overlay hidden">
          <div className="panel small">
            <h2>PAUSA</h2>
            <button id="btn-resume" className="btn-main">CONTINUAR</button>
            <button id="btn-quit" className="btn-ghost">SALIR AL MENÚ</button>
          </div>
        </div>

        {/* ---------------- GAME OVER ---------------- */}
        <div id="screen-over" className="overlay hidden">
          <div className="panel">
            <h2 className="over-title">ATROPELLADO</h2>
            <div id="new-record" className="record hidden">¡NUEVO RÉCORD!</div>

            <div className="stats">
              <div className="stat"><span>Puntos</span><b id="over-score">0</b></div>
              <div className="stat"><span>Distancia</span><b id="over-dist">0 m</b></div>
              <div className="stat"><span>Monedas</span><b id="over-coins">0</b></div>
              <div className="stat"><span>Récord</span><b id="over-best">0</b></div>
            </div>

            <p className="earned">+<b id="over-earned">0</b> 🪙 al banco · total <b id="over-bank">0</b></p>

            <button id="btn-retry" className="btn-main">REINTENTAR</button>
            <button id="btn-shop2" className="btn-second">TIENDA</button>
            <button id="btn-menu" className="btn-ghost">MENÚ</button>
          </div>
        </div>

        <div id="flash"></div>
      </div>
      </div>

      <div className="side">
        <div className="box"><h2>PUNTOS</h2><div className="val" id="hud-score">0</div></div>
        <div className="box"><h2>DISTANCIA</h2><div className="val" id="hud-dist">0 m</div></div>
        <div className="box"><h2>MONEDAS</h2><div className="val" id="hud-coins">0</div></div>
        <div className="box ancho solo-texto">
          <h2>CONTROLES</h2>
          <div className="keys">
            <b>&larr; &rarr;</b> cambiar de carril<br />
            <b>&uarr;</b> o <b>Espacio</b> saltar<br />
            <b>&darr;</b> deslizarse<br />
            <b>P</b> pausa · <b>M</b> sonido
          </div>
        </div>
        <div className="box ancho solo-texto">
          <h2>REGLAS</h2>
          <div className="keys">Los trenes se pueden usar de plataforma. Las monedas se gastan en la tienda del menú.</div>
        </div>
        <a className="back" href="/">&lt; VOLVER AL SALÓN</a>
      </div>
    </>
  );
}

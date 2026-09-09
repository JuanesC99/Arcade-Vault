/* ============================================================
   movil.js — controles táctiles y maquetación para pantallas pequeñas.

   Cada cabina declara qué mando necesita antes de cargar este archivo:

     window.MANDO = {
       cruceta: 'cuatro' | 'horizontal' | 'tetris' | 'nave' | null,
       acciones: [ { k: ' ', txt: 'FUEGO' }, { k: 'p', txt: 'II' } ],
       arrastre: true,        // reenvía el dedo como movimiento de ratón
       toque: true,           // reenvía el toque como clic de ratón
       alterno: { txt:'BANDERA', selector:'#tablero', evento:'contextmenu' }
     };

   Los botones no llaman a ninguna función del juego: disparan eventos
   de teclado con la misma tecla que ya escucha la cabina. Así ningún
   juego necesita cambiar su lógica para funcionar con el dedo.

   Se carga con guarda: si faltara, todo sigue funcionando con teclado.
   ============================================================ */
(function () {
  'use strict';

  var CONF = window.MANDO || {};
  var hayTacto = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var esPequena = window.innerWidth <= 900;

  /* ---------------- estilos ---------------- */
  var css = document.createElement('style');
  css.textContent = [
    /* ------- maquetación en pantallas pequeñas ------- */
    '@media (max-width: 900px){',
    '  body{',
    '    flex-direction:column !important;',
    /* en columna, wrap reparte los elementos en varias columnas: hay que quitarlo */
    '    flex-wrap:nowrap !important;',
    '    align-items:center !important;',
    '    justify-content:flex-start !important;',
    '    gap:12px !important;',
    '    padding:10px 7px 0 !important;',
    '    min-height:100dvh;',
    '  }',
    '  body.con-mando{padding-bottom:var(--alto-mando, 170px) !important}',
    '  h1,.cabina-titulo{font-size:11px !important;margin:0 0 4px !important;text-align:center}',
    '  .pantalla-caja{margin-top:4px}',
    /* el mando ya explica los controles, así que esas cajas sobran */
    '  .side .box.solo-texto{display:none !important}',
    '  .side{width:100% !important;max-width:520px !important}',
    '  .side .box{margin-bottom:8px !important;padding:9px 11px !important}',
    '  .side .box h2{font-size:8px !important;margin-bottom:5px !important}',
    '  .side .box .val{font-size:13px !important}',
    /* los marcadores en dos columnas, para que ocupen poco */
    '  .side{display:grid;grid-template-columns:1fr 1fr;gap:0 8px;align-content:start}',
    '  .side .box.ancho, .side .back{grid-column:1 / -1}',
    '  .back{text-align:center;padding:11px !important;font-size:9px !important}',
    '}',

    /* ------- el mando ------- */
    '.mando{',
    '  position:fixed;left:0;right:0;bottom:0;z-index:1200;',
    '  display:none;align-items:flex-end;justify-content:space-between;',
    '  gap:12px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));',
    '  background:linear-gradient(to top, rgba(7,6,13,.96), rgba(7,6,13,.55));',
    '  border-top:1px solid #2e2a4a;',
    '  touch-action:none;user-select:none;-webkit-user-select:none;',
    '}',
    'body.con-mando .mando{display:flex}',

    '.mando .cruceta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
    '.mando .acciones{display:flex;flex-direction:column;gap:6px;align-items:flex-end}',

    '.mando button{',
    "  font-family:'Press Start 2P',monospace;",
    '  color:#e9e5ff;background:rgba(27,24,48,.94);border:1px solid #2e2a4a;',
    '  border-radius:10px;padding:0;cursor:pointer;',
    '  touch-action:none;-webkit-tap-highlight-color:transparent;',
    '  transition:background .06s, border-color .06s, transform .06s;',
    '}',
    '.mando .cruceta button{width:58px;height:52px;font-size:17px}',
    '.mando .cruceta .vacio{visibility:hidden}',
    '.mando .acciones button{min-width:96px;height:48px;font-size:10px;padding:0 12px}',
    '.mando button.pulsado{background:#35f0d0;border-color:#35f0d0;color:#07060d;transform:scale(.94)}',
    '.mando button.activo{background:#ffb020;border-color:#ffb020;color:#07060d}',

    /* en apaisado el mando se hace más bajo para no comerse el juego */
    '@media (max-height: 520px){',
    '  .mando .cruceta button{width:50px;height:42px;font-size:15px}',
    '  .mando .acciones button{height:40px;min-width:84px}',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  if (!hayTacto && !esPequena) return;   // en un ratón de escritorio no hace falta mando

  /* ---------------- crucetas predefinidas ---------------- */
  var IZQ = { k: 'ArrowLeft', txt: '◀', repetir: true };
  var DER = { k: 'ArrowRight', txt: '▶', repetir: true };
  var ARR = { k: 'ArrowUp', txt: '▲' };
  var ABA = { k: 'ArrowDown', txt: '▼', repetir: true };

  var CRUCETAS = {
    cuatro:     [null, ARR, null, IZQ, null, DER, null, ABA, null],
    horizontal: [null, null, null, IZQ, null, DER, null, null, null],
    tetris:     [null, { k: 'ArrowUp', txt: '↻' }, null, IZQ, null, DER, null, ABA, null],
    nave:       [null, { k: 'ArrowUp', txt: '▲', repetir: false }, null, IZQ, null, DER, null, null, null]
  };

  var celdas = CONF.cruceta ? CRUCETAS[CONF.cruceta] : null;
  var acciones = CONF.acciones || [];

  /* ---------------- disparo de teclas ---------------- */
  function tecla(tipo, k) {
    document.dispatchEvent(new KeyboardEvent(tipo, { key: k, bubbles: true, cancelable: true }));
  }

  function armar(boton, def) {
    var repeticion = null;

    function pulsar(e) {
      e.preventDefault();
      boton.classList.add('pulsado');
      tecla('keydown', def.k);
      if (def.repetir) {
        clearInterval(repeticion);
        repeticion = setInterval(function () { tecla('keydown', def.k); }, 110);
      }
    }

    function soltar(e) {
      if (e) e.preventDefault();
      boton.classList.remove('pulsado');
      clearInterval(repeticion);
      repeticion = null;
      tecla('keyup', def.k);
    }

    boton.addEventListener('pointerdown', pulsar);
    boton.addEventListener('pointerup', soltar);
    boton.addEventListener('pointercancel', soltar);
    boton.addEventListener('pointerleave', function (e) {
      if (boton.classList.contains('pulsado')) soltar(e);
    });
  }

  /* ---------------- montaje del mando ---------------- */
  var mando = null;

  if (celdas || acciones.length || CONF.alterno) {
    mando = document.createElement('div');
    mando.className = 'mando';

    var cruceta = document.createElement('div');
    cruceta.className = 'cruceta';
    if (celdas) {
      celdas.forEach(function (def) {
        var b = document.createElement('button');
        if (!def) {
          b.className = 'vacio';
          b.textContent = '.';
        } else {
          b.textContent = def.txt;
          armar(b, def);
        }
        cruceta.appendChild(b);
      });
    }
    mando.appendChild(cruceta);

    var zona = document.createElement('div');
    zona.className = 'acciones';

    acciones.forEach(function (def) {
      var b = document.createElement('button');
      b.textContent = def.txt;
      armar(b, def);
      zona.appendChild(b);
    });

    // botón que cambia el significado del toque, para el campo minado
    if (CONF.alterno) {
      var alterno = document.createElement('button');
      alterno.textContent = CONF.alterno.txt;
      var activo = false;
      alterno.addEventListener('click', function () {
        activo = !activo;
        alterno.classList.toggle('activo', activo);
      });
      zona.appendChild(alterno);

      var destino = document.querySelector(CONF.alterno.selector);
      if (destino) {
        destino.addEventListener('click', function (e) {
          if (!activo) return;
          e.preventDefault();
          e.stopPropagation();
          e.target.dispatchEvent(new MouseEvent(CONF.alterno.evento, {
            bubbles: true, cancelable: true,
            clientX: e.clientX, clientY: e.clientY
          }));
        }, true);
      }
    }

    mando.appendChild(zona);
    document.body.appendChild(mando);
    document.body.classList.add('con-mando');

    var medir = function () {
      document.documentElement.style.setProperty('--alto-mando', (mando.offsetHeight + 12) + 'px');
      if (window.Pantalla) window.Pantalla.ajustar();
    };
    medir();
    window.addEventListener('resize', medir);
  }

  /* ---------------- el dedo como ratón ----------------
     Arkanoid y Pong solo escuchan mousemove, y Vuelo Rasante solo
     mousedown. En vez de tocar esos juegos, se traduce el toque. */
  var lienzo = document.querySelector('canvas');

  if (lienzo && CONF.arrastre) {
    var reenviar = function (e) {
      if (!e.touches.length) return;
      e.preventDefault();
      var t = e.touches[0];
      lienzo.dispatchEvent(new MouseEvent('mousemove', {
        clientX: t.clientX, clientY: t.clientY, bubbles: true
      }));
    };
    lienzo.addEventListener('touchstart', reenviar, { passive: false });
    lienzo.addEventListener('touchmove', reenviar, { passive: false });
    lienzo.style.touchAction = 'none';
  }

  if (lienzo && CONF.toque) {
    lienzo.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      lienzo.dispatchEvent(new MouseEvent('mousedown', {
        clientX: t ? t.clientX : 0, clientY: t ? t.clientY : 0, bubbles: true
      }));
    }, { passive: false });
    lienzo.style.touchAction = 'none';
  }

  window.Movil = { mando: mando };
})();

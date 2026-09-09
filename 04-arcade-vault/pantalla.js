/* ============================================================
   pantalla.js — ajuste del tamaño de las cabinas.

   Hace dos cosas con el mismo mecanismo:

   1. Pantalla completa, con el botón del panel o la tecla F.
   2. Encaje automático en pantallas pequeñas, para que la cabina
      quepa de ancho en un móvil sin desbordar.

   En los dos casos se agranda o encoge el marco con
   `transform: scale`, nunca el lienzo. Así la lógica de cada juego
   sigue trabajando en sus coordenadas de siempre: getBoundingClientRect
   ya devuelve el tamaño escalado, que es justo lo que usan las cabinas
   para traducir la posición del ratón o del dedo.

   El marco va envuelto en una caja del tamaño ya escalado, porque
   `transform` no cambia el hueco que ocupa un elemento y sin eso la
   página desbordaría a lo ancho.

   Se carga con guarda, igual que salon.js: si faltara, los juegos
   seguirían funcionando sin ajuste ni pantalla completa.
   ============================================================ */
(function () {
  'use strict';

  // El marco es la caja que se escala. Cada cabina tiene la suya:
  // .stage en la mayoría, #app en Metro Rush, y el propio lienzo en
  // Arkanoid, que no lleva ni marco ni panel.
  var marco = document.querySelector('.stage') ||
              document.getElementById('app') ||
              document.querySelector('canvas');
  if (!marco) return;
  marco.classList.add('pantalla-marco');

  var hayPantallaCompleta = !!document.documentElement.requestFullscreen;

  var MARGEN_ANCHO = 0.98;
  var MARGEN_ALTO = 0.94;
  var ANCHO_MOVIL = 900;      // a partir de aquí se considera pantalla pequeña
  var MARGEN_LATERAL = 14;

  /* ---------------- caja que reserva el hueco ---------------- */
  var caja = document.createElement('div');
  caja.className = 'pantalla-caja';
  marco.parentNode.insertBefore(caja, marco);
  caja.appendChild(marco);

  /* ---------------- estilos ---------------- */
  var css = document.createElement('style');
  css.textContent = [
    '.pantalla-caja{position:relative}',

    '.pantalla-btn{',
    '  display:block;width:100%;margin-top:10px;',
    "  font-family:'Press Start 2P',monospace;font-size:8px;line-height:1.6;",
    '  color:#e9e5ff;background:#1b1830;border:1px solid #2e2a4a;',
    '  padding:10px 8px;cursor:pointer;text-align:center;',
    '}',
    '.pantalla-btn:hover{border-color:#35f0d0;color:#35f0d0}',

    'body.en-pantalla{',
    '  padding:0;gap:0;overflow:hidden;',
    '  align-items:center;justify-content:center;',
    '}',
    'body.en-pantalla .side,',
    'body.en-pantalla h1,',
    'body.en-pantalla .cabina-titulo{display:none}',
    'body.en-pantalla .pantalla-caja{width:auto !important;height:auto !important}',
    'body.en-pantalla .pantalla-marco{',
    '  transform-origin:center center;',
    '  box-shadow:0 0 0 6px #12101f;',
    '}',

    /* botón flotante para las cabinas sin panel lateral */
    '.pantalla-btn.suelto{',
    '  position:fixed;top:14px;right:14px;z-index:1500;width:auto;margin:0;',
    '  background:rgba(18,16,31,.92);',
    '}',
    'body.en-pantalla .pantalla-btn.suelto{opacity:.25}',
    'body.en-pantalla .pantalla-btn.suelto:hover{opacity:1}',

    /* aviso que aparece un momento al entrar */
    '#pantalla-aviso{',
    '  position:fixed;left:50%;bottom:22px;transform:translateX(-50%);',
    '  z-index:2000;pointer-events:none;',
    "  font-family:'Press Start 2P',monospace;font-size:9px;",
    '  color:#e9e5ff;background:rgba(7,6,13,.85);',
    '  border:1px solid #2e2a4a;padding:10px 14px;',
    '  opacity:0;transition:opacity .3s;',
    '}',
    '#pantalla-aviso.ver{opacity:1}',

    /* en pantallas pequeñas el botón de pantalla completa estorba */
    '@media (max-width: 900px){ .pantalla-btn, .caja-pantalla{display:none !important} }'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------- botón ---------------- */
  var boton = document.createElement('button');
  boton.className = 'pantalla-btn';
  boton.textContent = 'PANTALLA COMPLETA (F)';

  if (hayPantallaCompleta) {
    var panel = document.querySelector('.side');
    if (panel) {
      var cajaBoton = document.createElement('div');
      cajaBoton.className = 'box caja-pantalla';
      cajaBoton.appendChild(boton);
      var volver = panel.querySelector('.back');
      if (volver) panel.insertBefore(cajaBoton, volver);
      else panel.appendChild(cajaBoton);
    } else {
      boton.classList.add('suelto');
      document.body.appendChild(boton);
    }
  }

  /* ---------------- aviso ---------------- */
  var aviso = document.createElement('div');
  aviso.id = 'pantalla-aviso';
  aviso.textContent = 'F O ESC PARA SALIR';
  document.body.appendChild(aviso);

  var temporizador = null;
  function mostrarAviso() {
    aviso.classList.add('ver');
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { aviso.classList.remove('ver'); }, 2600);
  }

  /* ---------------- cálculo del factor ---------------- */
  function factor(w, h) {
    if (document.fullscreenElement) {
      return Math.max(1, Math.min(
        window.innerWidth * MARGEN_ANCHO / w,
        window.innerHeight * MARGEN_ALTO / h
      ));
    }

    if (window.innerWidth > ANCHO_MOVIL) return 1;

    // hueco que hay que dejar libre abajo para el mando táctil
    var mando = document.querySelector('.mando');
    var reserva = mando ? mando.offsetHeight + 30 : 30;

    return Math.min(
      1,
      (window.innerWidth - MARGEN_LATERAL) / w,
      (window.innerHeight - reserva) / h
    );
  }

  function ajustar() {
    var enPantalla = !!document.fullscreenElement;
    document.body.classList.toggle('en-pantalla', enPantalla);
    boton.textContent = enPantalla ? 'SALIR (F)' : 'PANTALLA COMPLETA (F)';

    // Se mide sin ninguna restricción puesta por una pasada anterior.
    // Si no, la caja ya encogida haría que el marco midiera menos de lo
    // que mide en realidad y el ajuste se deshría a sí mismo.
    marco.style.transform = '';
    marco.style.minWidth = '';
    caja.style.width = '';
    caja.style.height = '';

    var w = marco.offsetWidth, h = marco.offsetHeight;
    if (!w || !h) return;

    var k = factor(w, h);

    if (k === 1 && !enPantalla) {
      document.documentElement.style.setProperty('--escala', 1);
      return;
    }

    marco.style.transformOrigin = enPantalla ? 'center center' : 'top left';
    marco.style.transform = 'scale(' + k + ')';

    if (!enPantalla) {
      // el ancho mínimo evita que la caja, ya encogida, apriete al marco
      marco.style.minWidth = w + 'px';
      caja.style.width = Math.round(w * k) + 'px';
      caja.style.height = Math.round(h * k) + 'px';
    }

    // el rompecabezas usa esta variable para agrandar la pieza que lleva en la mano
    document.documentElement.style.setProperty('--escala', k);
  }

  function alternar() {
    if (!hayPantallaCompleta) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      var p = document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(function () { /* el navegador lo bloqueó, no pasa nada */ });
      mostrarAviso();
    }
  }

  boton.addEventListener('click', alternar);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'f' || e.key === 'F') {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      alternar();
    }
  });

  document.addEventListener('fullscreenchange', ajustar);
  window.addEventListener('resize', ajustar);
  window.addEventListener('orientationchange', function () { setTimeout(ajustar, 250); });

  ajustar();
  // la tipografía de píxel llega más tarde y cambia las medidas del panel
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
  window.addEventListener('load', ajustar);

  window.Pantalla = { alternar: alternar, ajustar: ajustar };
})();

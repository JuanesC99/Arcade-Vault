/* ============================================================
   pantalla.js — pantalla completa para las cabinas del salón.

   Añade un botón al panel lateral y la tecla F. Al entrar,
   esconde el panel y el título y agranda el marco del juego
   hasta llenar la pantalla, manteniendo su proporción.

   El marco se agranda con `transform: scale`, no cambiando el
   tamaño del lienzo. Así la lógica de cada juego sigue trabajando
   en sus coordenadas de siempre: getBoundingClientRect ya devuelve
   el tamaño escalado, que es justo lo que usan las cabinas para
   traducir la posición del ratón.

   Se carga con guarda, igual que salon.js: si faltara, los juegos
   seguirían funcionando sin pantalla completa.
   ============================================================ */
(function () {
  'use strict';

  // El marco es la caja que se agranda. Cada cabina tiene la suya:
  // .stage en la mayoría, #app en Metro Rush, y el propio lienzo en
  // Arkanoid, que no lleva ni marco ni panel.
  var marco = document.querySelector('.stage') ||
              document.getElementById('app') ||
              document.querySelector('canvas');
  if (!marco || !document.documentElement.requestFullscreen) return;
  marco.classList.add('pantalla-marco');

  var MARGEN_ANCHO = 0.98;
  var MARGEN_ALTO = 0.94;

  /* ---------------- estilos ---------------- */
  var css = document.createElement('style');
  css.textContent = [
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
    '#pantalla-aviso.ver{opacity:1}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------------- botón ---------------- */
  var boton = document.createElement('button');
  boton.className = 'pantalla-btn';
  boton.textContent = 'PANTALLA COMPLETA (F)';

  var panel = document.querySelector('.side');
  if (panel) {
    var caja = document.createElement('div');
    caja.className = 'box';
    caja.appendChild(boton);
    // justo antes del enlace de volver al salón, si existe
    var volver = panel.querySelector('.back');
    if (volver) panel.insertBefore(caja, volver);
    else panel.appendChild(caja);
  } else {
    boton.classList.add('suelto');
    document.body.appendChild(boton);
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

  /* ---------------- ajuste del tamaño ---------------- */
  function ajustar() {
    if (!document.fullscreenElement) {
      document.body.classList.remove('en-pantalla');
      marco.style.transform = '';
      document.documentElement.style.setProperty('--escala', 1);
      boton.textContent = 'PANTALLA COMPLETA (F)';
      return;
    }

    document.body.classList.add('en-pantalla');
    boton.textContent = 'SALIR (F)';

    // offsetWidth no cuenta el transform, así que siempre mide el marco real
    var w = marco.offsetWidth, h = marco.offsetHeight;
    if (!w || !h) return;

    var k = Math.min(
      window.innerWidth * MARGEN_ANCHO / w,
      window.innerHeight * MARGEN_ALTO / h
    );
    k = Math.max(1, k);

    marco.style.transform = 'scale(' + k + ')';
    // el rompecabezas usa esta variable para agrandar la pieza que lleva en la mano
    document.documentElement.style.setProperty('--escala', k);
  }

  function alternar() {
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
      // no robar la tecla si el jugador está escribiendo en algún campo
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      alternar();
    }
  });

  document.addEventListener('fullscreenchange', ajustar);
  window.addEventListener('resize', ajustar);

  window.Pantalla = { alternar: alternar, ajustar: ajustar };
})();

/* ============================================================
   sonido.js — efectos y música del Arcade Vault, sintetizados.

   No hay ni un archivo de audio: todo sale de osciladores y ruido
   blanco de la Web Audio API, así que el repositorio no engorda.

   Uso desde una cabina:
     <script src="../04-arcade-vault/sonido.js"></script>
     ...
     const sfx = n => window.Sonido && Sonido.efecto(n);
     sfx('disparo');
     window.Sonido && Sonido.melodia('tanques');

   Se carga con guarda, igual que salon.js y pantalla.js: si faltara,
   los juegos seguirían funcionando en silencio.

   El navegador no deja sonar nada hasta que el usuario toca algo,
   así que el contexto se crea en el primer gesto y no antes.
   ============================================================ */
(function () {
  'use strict';

  var CLAVE = 'arcadeVault:sonido';
  var ctx = null, maestro = null, busEfectos = null, busMusica = null;
  var ruidoBuffer = null;
  var encendido = true;
  var despierto = false;

  try { encendido = localStorage.getItem(CLAVE) !== '0'; } catch (e) {}

  /* ---------------- notas ---------------- */

  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function hz(nota) {
    if (typeof nota === 'number') return nota;
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(nota);
    if (!m) return 440;
    var n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  /* ---------------- arranque ---------------- */

  function arrancar() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }

    maestro = ctx.createGain();
    maestro.gain.value = encendido ? 0.9 : 0;
    maestro.connect(ctx.destination);

    busEfectos = ctx.createGain();
    busEfectos.gain.value = 0.34;
    busEfectos.connect(maestro);

    busMusica = ctx.createGain();
    busMusica.gain.value = 0.15;
    busMusica.connect(maestro);

    var largo = Math.floor(ctx.sampleRate * 0.6);
    ruidoBuffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    var datos = ruidoBuffer.getChannelData(0);
    for (var i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;

    return ctx;
  }

  function despertar() {
    var c = arrancar();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    if (!despierto) {
      despierto = true;
      if (melodiaPedida) melodia(melodiaPedida);
    }
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, despertar, { passive: true });
  });

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (encendido) ctx.resume();
  });

  /* ---------------- una voz suelta ---------------- */

  function voz(o, cuando, destino) {
    if (!ctx) return null;
    var t = cuando + (o.retardo || 0);
    var dur = o.dur || 0.1;
    var vol = o.vol == null ? 0.25 : o.vol;
    var g = ctx.createGain();
    var fuente;

    if (o.ruido) {
      fuente = ctx.createBufferSource();
      fuente.buffer = ruidoBuffer;
      fuente.loop = true;
      var filtro = ctx.createBiquadFilter();
      filtro.type = o.paso === 'alto' ? 'highpass' : 'lowpass';
      filtro.Q.value = o.q || 1;
      filtro.frequency.setValueAtTime(Math.max(40, o.f0), t);
      filtro.frequency.exponentialRampToValueAtTime(Math.max(40, o.f1 || o.f0), t + dur);
      fuente.connect(filtro);
      filtro.connect(g);
    } else {
      fuente = ctx.createOscillator();
      fuente.type = o.onda || 'square';
      fuente.frequency.setValueAtTime(Math.max(1, o.f0), t);
      if (o.f1 && o.f1 !== o.f0) {
        fuente.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + dur);
      }
      fuente.connect(g);
    }

    var ataque = Math.min(0.012, dur * 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(destino || busEfectos);

    fuente.start(t);
    fuente.stop(t + dur + 0.03);
    return fuente;
  }

  /* ---------------- catálogo de efectos ---------------- */

  var CATALOGO = {
    /* comunes */
    disparo:    [{ onda: 'square', f0: 900, f1: 180, dur: 0.09, vol: 0.22 }],
    explosion:  [{ ruido: 1, f0: 1700, f1: 90, dur: 0.5, vol: 0.5 },
                 { onda: 'triangle', f0: 190, f1: 40, dur: 0.42, vol: 0.3 }],
    ladrillo:   [{ ruido: 1, f0: 2800, f1: 800, dur: 0.11, vol: 0.26 }],
    metal:      [{ onda: 'square', f0: 2100, f1: 1500, dur: 0.06, vol: 0.12 },
                 { ruido: 1, f0: 5200, f1: 2600, dur: 0.07, vol: 0.18, paso: 'alto' }],
    premio:     [{ onda: 'square', f0: hz('E5'), dur: 0.08, vol: 0.2 },
                 { onda: 'square', f0: hz('G5'), dur: 0.08, vol: 0.2, retardo: 0.07 },
                 { onda: 'square', f0: hz('C6'), dur: 0.16, vol: 0.2, retardo: 0.14 }],
    vida:       [{ onda: 'triangle', f0: hz('C5'), dur: 0.12, vol: 0.24 },
                 { onda: 'triangle', f0: hz('E5'), dur: 0.12, vol: 0.24, retardo: 0.1 },
                 { onda: 'triangle', f0: hz('G5'), dur: 0.22, vol: 0.24, retardo: 0.2 }],
    muerte:     [{ onda: 'sawtooth', f0: 460, f1: 55, dur: 0.75, vol: 0.28 },
                 { ruido: 1, f0: 900, f1: 100, dur: 0.6, vol: 0.2 }],
    nivel:      [{ onda: 'square', f0: hz('C5'), dur: 0.13, vol: 0.22 },
                 { onda: 'square', f0: hz('E5'), dur: 0.13, vol: 0.22, retardo: 0.13 },
                 { onda: 'square', f0: hz('G5'), dur: 0.13, vol: 0.22, retardo: 0.26 },
                 { onda: 'square', f0: hz('C6'), dur: 0.34, vol: 0.24, retardo: 0.39 }],

    /* plataformas */
    salto:      [{ onda: 'square', f0: 320, f1: 780, dur: 0.13, vol: 0.18 }],
    saltoPared: [{ onda: 'square', f0: 520, f1: 980, dur: 0.11, vol: 0.16 },
                 { ruido: 1, f0: 3200, f1: 900, dur: 0.1, vol: 0.12, paso: 'alto' }],
    espada:     [{ ruido: 1, f0: 4200, f1: 900, dur: 0.12, vol: 0.16, paso: 'alto' }],
    corte:      [{ ruido: 1, f0: 3000, f1: 400, dur: 0.16, vol: 0.26 },
                 { onda: 'square', f0: 320, f1: 120, dur: 0.12, vol: 0.16 }],
    ninpo:      [{ onda: 'sawtooth', f0: hz('A4'), f1: hz('A5'), dur: 0.22, vol: 0.2 },
                 { ruido: 1, f0: 1800, f1: 4000, dur: 0.22, vol: 0.12, paso: 'alto' }],
    dano:       [{ onda: 'sawtooth', f0: 300, f1: 90, dur: 0.24, vol: 0.28 }],

    /* boxeo */
    swing:      [{ ruido: 1, f0: 1100, f1: 240, dur: 0.14, vol: 0.14 }],
    impacto:    [{ onda: 'triangle', f0: 240, f1: 70, dur: 0.18, vol: 0.4 },
                 { ruido: 1, f0: 1500, f1: 220, dur: 0.13, vol: 0.26 }],
    bloqueo:    [{ onda: 'square', f0: 190, f1: 130, dur: 0.09, vol: 0.2 },
                 { ruido: 1, f0: 900, f1: 320, dur: 0.09, vol: 0.14 }],
    esquiva:    [{ onda: 'sine', f0: 880, f1: 1600, dur: 0.1, vol: 0.14 }],
    estrella:   [{ onda: 'square', f0: hz('G5'), dur: 0.07, vol: 0.18 },
                 { onda: 'square', f0: hz('B5'), dur: 0.07, vol: 0.18, retardo: 0.06 },
                 { onda: 'square', f0: hz('D6'), dur: 0.07, vol: 0.18, retardo: 0.12 },
                 { onda: 'square', f0: hz('G6'), dur: 0.2, vol: 0.18, retardo: 0.18 }],
    campana:    [{ onda: 'sine', f0: hz('C6'), dur: 0.9, vol: 0.3 },
                 { onda: 'sine', f0: hz('G6'), dur: 0.7, vol: 0.14 },
                 { onda: 'sine', f0: hz('C6'), dur: 0.9, vol: 0.3, retardo: 0.45 },
                 { onda: 'sine', f0: hz('G6'), dur: 0.7, vol: 0.14, retardo: 0.45 }],
    cuenta:     [{ onda: 'square', f0: 560, dur: 0.11, vol: 0.2 }],
    caida:      [{ onda: 'sawtooth', f0: 320, f1: 50, dur: 0.6, vol: 0.28 },
                 { ruido: 1, f0: 1300, f1: 110, dur: 0.5, vol: 0.28 }],
    aviso:      [{ onda: 'square', f0: 1500, dur: 0.04, vol: 0.07 }],
  };

  function efecto(nombre) {
    if (!encendido) return;
    var lista = CATALOGO[nombre];
    if (!lista) return;
    var c = arrancar();
    if (!c || c.state === 'suspended') return;
    var ahora = c.currentTime + 0.002;
    for (var i = 0; i < lista.length; i++) voz(lista[i], ahora);
  }

  /* ---------------- melodías ----------------
     Cada pista es una lista de [nota, duración en negras]; null es
     silencio. El bucle se programa entero por adelantado sobre el
     reloj del audio, que es el único que no se desfasa. */

  var MELODIAS = {
    tanques: {
      bpm: 126,
      pistas: [
        { onda: 'square', vol: 0.13, ligado: 0.85, notas: [
          ['A4',.5],['A4',.5],['C5',.5],['A4',.5],['E5',1],['D5',.5],['C5',.5],
          ['A4',.5],['A4',.5],['C5',.5],['E5',.5],['G4',2],
          ['F4',.5],['F4',.5],['A4',.5],['F4',.5],['C5',1],['B4',.5],['A4',.5],
          ['E4',.5],['G4',.5],['B4',.5],['C5',.5],['A4',2] ] },
        { onda: 'triangle', vol: 0.22, ligado: 0.7, notas: [
          ['A2',1],['A2',1],['E2',1],['E2',1],
          ['A2',1],['A2',1],['G2',1],['G2',1],
          ['F2',1],['F2',1],['C3',1],['C3',1],
          ['E2',1],['E2',1],['A2',1],['A2',1] ] },
      ]
    },

    sombra: {
      bpm: 150,
      pistas: [
        { onda: 'square', vol: 0.12, ligado: 0.8, notas: [
          ['E5',.5],['B4',.25],['E5',.25],['F#5',.5],['G5',.5],['F#5',.5],['E5',.5],['B4',1],
          ['A4',.5],['B4',.25],['C5',.25],['B4',.5],['A4',.5],['G4',.5],['F#4',.5],['E4',1],
          ['G5',.5],['F#5',.25],['E5',.25],['D5',.5],['E5',.5],['G5',1],['F#5',1],
          ['E5',.5],['D5',.5],['B4',.5],['A4',.5],['B4',2] ] },
        { onda: 'triangle', vol: 0.2, ligado: 0.65, notas: [
          ['E2',1],['E2',1],['B2',1],['B2',1],
          ['A2',1],['A2',1],['G2',1],['B2',1],
          ['C3',1],['C3',1],['G2',1],['G2',1],
          ['A2',1],['B2',1],['E2',2] ] },
      ]
    },

    combate: {
      bpm: 138,
      pistas: [
        { onda: 'square', vol: 0.13, ligado: 0.8, notas: [
          ['G4',.5],['G4',.5],['A4',.5],['B4',.5],['C5',1],['B4',1],
          ['G4',.5],['G4',.5],['F4',.5],['E4',.5],['D4',2],
          ['E4',.5],['F4',.5],['G4',.5],['A4',.5],['B4',1],['G4',1],
          ['C5',.5],['B4',.5],['A4',.5],['G4',.5],['C5',2] ] },
        { onda: 'triangle', vol: 0.22, ligado: 0.6, notas: [
          ['C3',1],['C3',1],['G2',1],['G2',1],
          ['C3',1],['C3',1],['G2',1],['G2',1],
          ['F2',1],['F2',1],['C3',1],['C3',1],
          ['G2',1],['G2',1],['C3',2] ] },
      ]
    },

    fontanero: {
      bpm: 168,
      pistas: [
        { onda: 'square', vol: 0.11, ligado: 0.7, notas: [
          ['C5',.5],['E5',.5],['G5',.5],['E5',.5],['A5',1],['G5',1],
          ['F5',.5],['E5',.5],['D5',.5],['C5',.5],['D5',1],['G4',1],
          ['C5',.5],['E5',.5],['G5',.5],['C6',.5],['B5',.5],['A5',.5],['G5',1],
          ['F5',.5],['D5',.5],['E5',.5],['C5',.5],['C5',2] ] },
        { onda: 'triangle', vol: 0.2, ligado: 0.5, notas: [
          ['C3',1],['G2',1],['C3',1],['G2',1],
          ['F2',1],['C3',1],['G2',1],['D3',1],
          ['C3',1],['G2',1],['A2',1],['E3',1],
          ['F2',1],['G2',1],['C3',2] ] },
      ]
    },
  };

  var melodiaPedida = null, compilada = null, siguienteBucle = 0;
  var reloj = null, vivas = [];

  function compilar(m) {
    var seg = 60 / m.bpm, eventos = [], total = 0;
    m.pistas.forEach(function (p) {
      var t = 0;
      p.notas.forEach(function (par) {
        var dur = par[1] * seg;
        if (par[0]) eventos.push({
          t: t, f0: hz(par[0]), dur: dur * (p.ligado || 0.85),
          onda: p.onda, vol: p.vol
        });
        t += dur;
      });
      if (t > total) total = t;
    });
    return { eventos: eventos, total: total };
  }

  function bombear() {
    if (!compilada || !ctx || !encendido) return;
    var limite = ctx.currentTime + 1.2;
    while (siguienteBucle < limite) {
      for (var i = 0; i < compilada.eventos.length; i++) {
        var e = compilada.eventos[i];
        var f = voz(e, siguienteBucle + e.t, busMusica);
        if (f) vivas.push(f);
      }
      siguienteBucle += compilada.total;
    }
    // se limpian las voces ya apagadas para no acumular referencias
    if (vivas.length > 400) vivas = vivas.slice(-200);
  }

  function melodia(nombre) {
    melodiaPedida = nombre || null;
    parar();
    if (!nombre || !MELODIAS[nombre]) return;
    var c = arrancar();
    if (!c || c.state === 'suspended') return;   // sonará en cuanto haya un gesto
    compilada = compilar(MELODIAS[nombre]);
    siguienteBucle = c.currentTime + 0.08;
    bombear();
    reloj = setInterval(bombear, 500);
  }

  function parar() {
    clearInterval(reloj);
    reloj = null;
    compilada = null;
    for (var i = 0; i < vivas.length; i++) {
      try { vivas[i].stop(); } catch (e) {}
    }
    vivas = [];
  }

  /* ---------------- interruptor ---------------- */

  var boton = null;

  function pintarBoton() {
    if (boton) boton.textContent = 'SONIDO: ' + (encendido ? 'SÍ' : 'NO') + ' (M)';
  }

  function alternar() {
    encendido = !encendido;
    try { localStorage.setItem(CLAVE, encendido ? '1' : '0'); } catch (e) {}
    if (maestro) maestro.gain.value = encendido ? 0.9 : 0;
    if (encendido) {
      despertar();
      if (melodiaPedida && !reloj) melodia(melodiaPedida);
    } else parar();
    pintarBoton();
    return encendido;
  }

  var css = document.createElement('style');
  css.textContent = [
    '.sonido-btn{',
    '  display:block;width:100%;',
    "  font-family:'Press Start 2P',monospace;font-size:8px;line-height:1.6;",
    '  color:#e9e5ff;background:#1b1830;border:1px solid #2e2a4a;',
    '  padding:10px 8px;cursor:pointer;text-align:center;',
    '}',
    '.sonido-btn:hover{border-color:#35f0d0;color:#35f0d0}',
    '@media (max-width: 900px){ .caja-sonido{display:none !important} }'
  ].join('\n');
  document.head.appendChild(css);

  function montarBoton() {
    var panel = document.querySelector('.side');
    boton = document.createElement('button');
    boton.className = 'sonido-btn';
    boton.addEventListener('click', alternar);
    pintarBoton();

    if (panel) {
      var caja = document.createElement('div');
      caja.className = 'box caja-sonido';
      caja.appendChild(boton);
      var volver = panel.querySelector('.back');
      if (volver) panel.insertBefore(caja, volver);
      else panel.appendChild(caja);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarBoton);
  } else montarBoton();

  document.addEventListener('keydown', function (e) {
    // si se está escribiendo en un campo, la eme es una letra y no un mando
    var donde = (e.target && e.target.tagName) || '';
    if (donde === 'INPUT' || donde === 'TEXTAREA') return;
    if (e.key && e.key.toLowerCase() === 'm' && !e.repeat) alternar();
  });

  window.Sonido = {
    efecto: efecto,
    melodia: melodia,
    parar: parar,
    alternar: alternar,
    activo: function () { return encendido; }
  };
})();

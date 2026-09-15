/**
 * Motor de la cabina 02-game.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = {};

export function iniciar(entorno) {
  const {
    document,
    window,
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  } = entorno;

  /* ---------- js/utils.js ---------- */
  /* ============================================================
     utils.js — helpers matemáticos y de color
     ============================================================ */
  'use strict';

  const U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp:  (a, b, t) => a + (b - a) * t,
    rand:  (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    chance: (p) => Math.random() < p,
    pick: (arr) => arr[(Math.random() * arr.length) | 0],

    /** Suavizado independiente del framerate. */
    damp: (cur, target, rate, dt) => U.lerp(cur, target, 1 - Math.exp(-rate * dt)),

    /** Elige un elemento con pesos: pickWeighted([['a',3],['b',1]]) */
    pickWeighted(pairs) {
      let total = 0;
      for (const p of pairs) total += p[1];
      let r = Math.random() * total;
      for (const p of pairs) {
        r -= p[1];
        if (r <= 0) return p[0];
      }
      return pairs[pairs.length - 1][0];
    },

    /** '#ff8800' -> [255,136,0] */
    hex(h) {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },

    rgb(c, a) {
      return a === undefined
        ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
        : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    },

    /** Aclara (t>0) u oscurece (t<0) un color [r,g,b]. */
    shade(c, t) {
      const to = t > 0 ? 255 : 0;
      const k = Math.abs(t);
      return [U.lerp(c[0], to, k), U.lerp(c[1], to, k), U.lerp(c[2], to, k)];
    },

    mix: (a, b, t) => [U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)],

    /** Formatea números grandes con separador de miles. */
    fmt: (n) => Math.floor(n).toLocaleString('es-ES'),

    /** Solapamiento de dos intervalos [a1,a2] y [b1,b2]. */
    overlap: (a1, a2, b1, b2) => a1 < b2 && b1 < a2,
  };

  /* Polyfill mínimo de roundRect para navegadores antiguos. */
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const k = Math.min(Math.abs(r) || 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + k, y);
      this.arcTo(x + w, y, x + w, y + h, k);
      this.arcTo(x + w, y + h, x, y + h, k);
      this.arcTo(x, y + h, x, y, k);
      this.arcTo(x, y, x + w, y, k);
      this.closePath();
      return this;
    };
  }

  /* ---------- js/store.js ---------- */
  /* ============================================================
     store.js — progreso persistente: banco de monedas, personajes
     desbloqueables y niveles de mejora de los potenciadores.
     ============================================================ */
  'use strict';

  const Store = {
    KEY: 'metrorush.save',

    data: {
      best: 0,
      bank: 0,                                  // monedas acumuladas entre partidas
      owned: ['nico'],
      selected: 'nico',
      up: { magnet: 1, shield: 1, boost: 1, jet: 1, boots: 1 },
    },

    // ---------------------- personajes ------------------------
    /**
     * style define la silueta de la cabeza: cap | ponytail | hood | beanie | halo
     * perk aplica un pequeño bonus (multiplicadores sobre 1).
     */
    CHARS: [
      {
        id: 'nico', name: 'Nico', price: 0,
        tag: 'El corredor de siempre', perkText: 'Equilibrado',
        style: 'cap', perk: {},
        pal: { skin: '#e8b48c', cloth: '#2fbfd6', cloth2: '#5ce0f2', pants: '#26304d',
               shoe: '#ff5a5f', cap: '#ff5a5f', pack: '#ffcf3d', pack2: '#e0a91d' },
      },
      {
        id: 'lia', name: 'Lía', price: 250,
        tag: 'Patinadora del subte', perkText: 'Imán +30 % de duración',
        style: 'ponytail', perk: { magnet: 1.3 },
        pal: { skin: '#f0c4a0', cloth: '#ef4f8f', cloth2: '#ff7fb2', pants: '#2b2340',
               shoe: '#ffe27a', cap: '#8b3ea0', pack: '#4bd8ff', pack2: '#2fa8cc' },
      },
      {
        id: 'bruno', name: 'Bruno', price: 600,
        tag: 'Mecánico de vías', perkText: 'Escudo +30 % de duración',
        style: 'beanie', perk: { shield: 1.3 },
        pal: { skin: '#c98a5e', cloth: '#4bbd6a', cloth2: '#79e394', pants: '#3a2f22',
               shoe: '#f0b429', cap: '#e2612f', pack: '#d9dee8', pack2: '#a9b2c4' },
      },
      {
        id: 'kenji', name: 'Kenji', price: 1200,
        tag: 'Sombra nocturna', perkText: 'Salto un 8 % más alto',
        style: 'hood', perk: { jump: 1.08 },
        pal: { skin: '#e2b18b', cloth: '#6b46d6', cloth2: '#9a7cf5', pants: '#171a2b',
               shoe: '#4bd8ff', cap: '#3d2b7a', pack: '#ff5a5f', pack2: '#c93b45' },
      },
      {
        id: 'aura', name: 'Aura', price: 2500,
        tag: 'Leyenda del andén', perkText: '+12 % de puntuación',
        style: 'halo', perk: { score: 1.12 },
        pal: { skin: '#f4d3b0', cloth: '#e8b923', cloth2: '#ffe27a', pants: '#4a3a12',
               shoe: '#ffffff', cap: '#fff2b8', pack: '#8b6cff', pack2: '#6a4fd6' },
      },
    ],

    // -------------------- mejoras (tienda) --------------------
    UPGRADES: {
      magnet: { name: 'Imán',            icon: '🧲', color: '#a86bff', base: 8.0, step: 1.4, max: 5,
                desc: 'Atrae las monedas cercanas' },
      shield: { name: 'Escudo',          icon: '🛡',  color: '#4bd8ff', base: 9.0, step: 1.4, max: 5,
                desc: 'Aguanta un golpe sin caer' },
      boost:  { name: 'Puntos x2',       icon: '★',  color: '#45e08a', base: 8.0, step: 1.4, max: 5,
                desc: 'Duplica todo lo que puntúas' },
      jet:    { name: 'Jetpack',         icon: '🚀', color: '#ff8a3d', base: 4.0, step: 0.7, max: 5,
                desc: 'Vuelas por encima de todo' },
      boots:  { name: 'Súper zapatillas',icon: '👟', color: '#ff5ac8', base: 7.0, step: 1.3, max: 5,
                desc: 'Saltos mucho más altos' },
    },

    // ------------------------ persistencia --------------------
    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const d = JSON.parse(raw);
          this.data.best = Number(d.best) || 0;
          this.data.bank = Number(d.bank) || 0;
          this.data.owned = Array.isArray(d.owned) && d.owned.length ? d.owned : ['nico'];
          if (!this.data.owned.includes('nico')) this.data.owned.push('nico');
          this.data.selected = this.data.owned.includes(d.selected) ? d.selected : 'nico';
          for (const k of Object.keys(this.data.up)) {
            const v = Math.round(Number(d.up && d.up[k]) || 1);
            this.data.up[k] = U.clamp(v, 1, this.UPGRADES[k].max);
          }
        } else {
          // Compatibilidad con la primera versión, que solo guardaba el récord.
          this.data.best = Number(localStorage.getItem('metrorush.best') || 0) || 0;
        }
      } catch (e) { /* almacenamiento no disponible */ }
      return this.data;
    },

    save() {
      try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ignorar */ }
    },

    // -------------------------- consultas ---------------------
    char(id) { return this.CHARS.find((c) => c.id === (id || this.data.selected)) || this.CHARS[0]; },
    owns(id) { return this.data.owned.includes(id); },

    /** Multiplicador del perk del personaje activo (1 si no aplica). */
    perk(key) { return this.char().perk[key] || 1; },

    level(key) { return this.data.up[key] || 1; },

    /** Duración efectiva de un potenciador: nivel + perk del personaje. */
    duration(key) {
      const u = this.UPGRADES[key];
      if (!u) return 0;
      return (u.base + u.step * (this.level(key) - 1)) * this.perk(key);
    },

    /** Coste de subir un potenciador al siguiente nivel (null si está al máximo). */
    upgradeCost(key) {
      const u = this.UPGRADES[key];
      const lv = this.level(key);
      if (lv >= u.max) return null;
      return Math.round(120 * Math.pow(lv, 1.45));
    },

    // -------------------------- compras -----------------------
    buyChar(id) {
      const ch = this.char(id);
      if (!ch || this.owns(id) || this.data.bank < ch.price) return false;
      this.data.bank -= ch.price;
      this.data.owned.push(id);
      this.data.selected = id;
      this.save();
      return true;
    },

    select(id) {
      if (!this.owns(id)) return false;
      this.data.selected = id;
      this.save();
      return true;
    },

    buyUpgrade(key) {
      const cost = this.upgradeCost(key);
      if (cost === null || this.data.bank < cost) return false;
      this.data.bank -= cost;
      this.data.up[key]++;
      this.save();
      return true;
    },

    addCoins(n) { this.data.bank += n; this.save(); },

    setBest(v) {
      if (v <= this.data.best) return false;
      this.data.best = Math.floor(v);
      this.save();
      return true;
    },
  };

  /* ---------- js/audio.js ---------- */
  /* ============================================================
     audio.js — sonido 100% sintetizado con Web Audio API.
     Sin archivos externos: todo se genera en tiempo real.
     ============================================================ */
  'use strict';

  const Sound = {
    ctx: null,
    master: null,
    musicGain: null,
    enabled: true,
    _step: 0,
    _nextNote: 0,
    _timer: null,

    /** Se crea en el primer gesto del usuario (política de autoplay). */
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.enabled = false; return; }

      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.master);
    },

    toggle() {
      this.enabled = !this.enabled;
      if (this.master) {
        this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, this.ctx.currentTime, 0.05);
      }
      return this.enabled;
    },

    /** Oscilador simple con envolvente ADSR reducida. */
    tone({ freq = 440, to = null, type = 'sine', dur = 0.15, vol = 0.25, delay = 0, glideEnd = 1 }) {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur * glideEnd);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    },

    /** Ráfaga de ruido blanco filtrado (impactos, aterrizajes). */
    noise({ dur = 0.25, vol = 0.3, cut = 1200, sweep = 200, type = 'lowpass' }) {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.setValueAtTime(cut, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(60, sweep), t + dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      src.connect(f).connect(g).connect(this.master);
      src.start(t);
    },

    // ---------- efectos del juego ----------
    jump()    { this.tone({ freq: 330, to: 700, type: 'triangle', dur: 0.18, vol: 0.22 }); },
    land()    { this.noise({ dur: 0.12, vol: 0.16, cut: 700, sweep: 120 }); },
    slide()   { this.noise({ dur: 0.34, vol: 0.16, cut: 2600, sweep: 400, type: 'bandpass' }); },
    lane()    { this.tone({ freq: 620, to: 880, type: 'square', dur: 0.06, vol: 0.06 }); },

    coin(streak = 0) {
      const base = 880 * Math.pow(2, Math.min(streak, 10) / 24);
      this.tone({ freq: base, type: 'square', dur: 0.07, vol: 0.1 });
      this.tone({ freq: base * 1.5, type: 'square', dur: 0.12, vol: 0.09, delay: 0.05 });
    },

    power() {
      [523, 659, 784, 1046].forEach((f, i) =>
        this.tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.16, delay: i * 0.06 }));
    },

    shieldHit() {
      this.tone({ freq: 900, to: 200, type: 'sawtooth', dur: 0.3, vol: 0.22 });
      this.noise({ dur: 0.25, vol: 0.2, cut: 3000, sweep: 300 });
    },

    /** Silbato del guardia: dos toques agudos con trino. */
    whistle() {
      if (!this.ctx || !this.enabled) return;
      for (let k = 0; k < 2; k++) {
        const t0 = this.ctx.currentTime + k * 0.17;
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const g = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2350, t0);
        lfo.type = 'sine';
        lfo.frequency.value = 34;              // trino del silbato
        lfoGain.gain.value = 130;
        lfo.connect(lfoGain).connect(osc.frequency);

        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);

        osc.connect(g).connect(this.master);
        osc.start(t0); osc.stop(t0 + 0.18);
        lfo.start(t0); lfo.stop(t0 + 0.18);
      }
    },

    crash() {
      this.noise({ dur: 0.7, vol: 0.45, cut: 1800, sweep: 60 });
      this.tone({ freq: 190, to: 45, type: 'sawtooth', dur: 0.65, vol: 0.3 });
      this.tone({ freq: 96, to: 30, type: 'square', dur: 0.8, vol: 0.2, delay: 0.05 });
    },

    // ---------- música: secuenciador mínimo ----------
    BASS: [55, 55, 82.4, 55, 65.4, 65.4, 49, 55],
    ARP:  [220, 329.6, 440, 329.6, 261.6, 392, 523.2, 392],

    startMusic() {
      if (!this.ctx) return;
      this.musicGain.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.8);
      if (this._timer) return;
      this._step = 0;
      this._nextNote = this.ctx.currentTime + 0.1;
      this._timer = setInterval(() => this._schedule(), 40);
    },

    stopMusic() {
      if (this.ctx) this.musicGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.25);
    },

    /** Programa las notas por adelantado para que no se oigan saltos. */
    _schedule() {
      if (!this.ctx) return;
      const spb = 0.145; // segundos por paso (~103 BPM en corcheas)
      while (this._nextNote < this.ctx.currentTime + 0.25) {
        const t = this._nextNote;
        const s = this._step % 8;

        this._note(this.BASS[s], t, spb * 0.9, 'sawtooth', 0.18, 260);
        if (s % 2 === 0) this._note(this.ARP[s], t, spb * 0.6, 'square', 0.055, 2400);
        if (s === 0 || s === 4) this._hat(t, 0.09);
        else if (s % 2 === 1) this._hat(t, 0.03);

        this._nextNote += spb;
        this._step++;
      }
    },

    _note(freq, t, dur, type, vol, cut) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cut;
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(f).connect(g).connect(this.musicGain);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },

    _hat(t, vol) {
      const len = Math.floor(this.ctx.sampleRate * 0.05);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 7000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f).connect(g).connect(this.musicGain);
      src.start(t);
    },
  };

  /* ---------- js/render.js ---------- */
  /* ============================================================
     render.js — motor de dibujo pseudo-3D sobre Canvas 2D.

     Sistema de coordenadas del mundo:
       x → derecha (carriles en -2, 0, 2)
       y → arriba  (suelo en y = 0)
       z → hacia el fondo (la cámara mira hacia +z)

     Proyección en perspectiva manual:
       s  = focal / (z - cam.z)
       sx = W/2 + (x - cam.x) * s
       sy = horizonte + (cam.y - y) * s
     ============================================================ */
  'use strict';

  const R = {
    canvas: null,
    ctx: null,
    W: 0, H: 0, dpr: 1,
    focal: 700,
    horizon: 0,
    cam: { x: 0, y: 3.4, z: -9 },
    NEAR: 0,               // plano de recorte cercano
    FAR: 190,              // distancia máxima dibujada
    shake: 0,
    flashT: 0,

    // ------------------------- paleta -------------------------
    C: {
      skyTop:   U.hex('#101a3a'),
      skyMid:   U.hex('#2b3f7a'),
      skyLow:   U.hex('#7a6ba6'),
      skyHaze:  U.hex('#e9a27b'),
      fog:      U.hex('#8f92b8'),
      ballast:  U.hex('#3b3f52'),
      ballast2: U.hex('#454a60'),
      sleeper:  U.hex('#59452f'),
      rail:     U.hex('#b9c2d4'),
      wall:     U.hex('#232a41'),
      wall2:    U.hex('#2c3450'),
      farBuild: U.hex('#1b2340'),
      nearBuild:U.hex('#141b33'),
      train:    U.hex('#c8d2e0'),
      trainAlt: U.hex('#e04a52'),
      glass:    U.hex('#0e2233'),
      barrier:  U.hex('#f0b429'),
      sign:     U.hex('#d63d47'),
      block:    U.hex('#5a6484'),
      coin:     U.hex('#ffcf3d'),
    },

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.NEAR = this.cam.z + 1.2;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = this.canvas.clientWidth || window.innerWidth;
      this.H = this.canvas.clientHeight || window.innerHeight;
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      // La focal se limita por el ancho para que las 3 vías quepan en móvil vertical.
      this.focal = Math.min(this.H * 0.95, this.W * 0.78);
      this.horizon = this.H * 0.40;
    },

    // --------------------- primitivas 3D ----------------------

    scaleAt(z) { return this.focal / (z - this.cam.z); },

    /** Proyecta un punto a coordenadas de pantalla. */
    proj(x, y, z, out) {
      const s = this.focal / (z - this.cam.z);
      out = out || {};
      out.x = this.W / 2 + (x - this.cam.x) * s;
      out.y = this.horizon + (this.cam.y - y) * s;
      out.s = s;
      return out;
    },

    /** Cuadrilátero horizontal (plano y constante). z1 = cerca, z2 = lejos. */
    quadXZ(y, x1, x2, z1, z2) {
      if (z2 <= this.NEAR) return false;
      if (z1 < this.NEAR) z1 = this.NEAR;
      const c = this.ctx, cam = this.cam, f = this.focal, hz = this.horizon, mx = this.W / 2;
      const s1 = f / (z1 - cam.z), s2 = f / (z2 - cam.z);
      const ya = hz + (cam.y - y) * s1, yb = hz + (cam.y - y) * s2;
      c.beginPath();
      c.moveTo(mx + (x1 - cam.x) * s1, ya);
      c.lineTo(mx + (x2 - cam.x) * s1, ya);
      c.lineTo(mx + (x2 - cam.x) * s2, yb);
      c.lineTo(mx + (x1 - cam.x) * s2, yb);
      c.closePath();
      return true;
    },

    /** Cuadrilátero vertical lateral (plano x constante). */
    quadZY(x, y1, y2, z1, z2) {
      if (z2 <= this.NEAR) return false;
      if (z1 < this.NEAR) z1 = this.NEAR;
      const c = this.ctx, cam = this.cam, f = this.focal, hz = this.horizon, mx = this.W / 2;
      const s1 = f / (z1 - cam.z), s2 = f / (z2 - cam.z);
      const xa = mx + (x - cam.x) * s1, xb = mx + (x - cam.x) * s2;
      c.beginPath();
      c.moveTo(xa, hz + (cam.y - y1) * s1);
      c.lineTo(xa, hz + (cam.y - y2) * s1);
      c.lineTo(xb, hz + (cam.y - y2) * s2);
      c.lineTo(xb, hz + (cam.y - y1) * s2);
      c.closePath();
      return true;
    },

    /** Cuadrilátero frontal (plano z constante). */
    quadXY(z, x1, x2, y1, y2) {
      if (z <= this.NEAR) return false;
      const c = this.ctx, cam = this.cam, f = this.focal, hz = this.horizon, mx = this.W / 2;
      const s = f / (z - cam.z);
      const xa = mx + (x1 - cam.x) * s, xb = mx + (x2 - cam.x) * s;
      const ya = hz + (cam.y - y2) * s, yb = hz + (cam.y - y1) * s;
      c.beginPath();
      c.rect(xa, ya, xb - xa, yb - ya);
      return true;
    },

    /** Atenuación por niebla en función de la profundidad. */
    fog(color, z) {
      const t = U.clamp((z - 35) / 120, 0, 1);
      return U.mix(color, this.C.fog, t * 0.85);
    },

    fill(color, z) { this.ctx.fillStyle = U.rgb(this.fog(color, z)); this.ctx.fill(); },

    // ------------------------- cielo --------------------------

    drawSky(dist) {
      const c = this.ctx, H = this.H, W = this.W;
      const g = c.createLinearGradient(0, 0, 0, this.horizon + 40);
      g.addColorStop(0.0, U.rgb(this.C.skyTop));
      g.addColorStop(0.45, U.rgb(this.C.skyMid));
      g.addColorStop(0.82, U.rgb(this.C.skyLow));
      g.addColorStop(1.0, U.rgb(this.C.skyHaze));
      c.fillStyle = g;
      c.fillRect(0, 0, W, this.horizon + 42);

      // sol bajo sobre el horizonte
      const sunX = W * 0.68, sunY = this.horizon - 26;
      const sg = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, H * 0.30);
      sg.addColorStop(0, 'rgba(255,214,160,.85)');
      sg.addColorStop(0.25, 'rgba(255,160,120,.28)');
      sg.addColorStop(1, 'rgba(255,150,110,0)');
      c.fillStyle = sg;
      c.fillRect(0, 0, W, this.horizon + 42);

      this.skyline(dist * 0.22, 88, this.C.farBuild, 0.55);
      this.skyline(dist * 0.55, 132, this.C.nearBuild, 1);
    },

    /** Skyline procedural determinista (parallax). */
    skyline(offset, maxH, color, alpha) {
      const c = this.ctx;
      const bw = Math.max(34, this.W * 0.045);
      const base = this.horizon + 6;
      const start = Math.floor(offset / bw);
      const n = Math.ceil(this.W / bw) + 2;

      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = U.rgb(color);
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const idx = start + i;
        const r = Math.abs(Math.sin(idx * 127.1 + maxH) * 43758.5453) % 1;
        const r2 = Math.abs(Math.sin(idx * 311.7 + maxH) * 24634.6345) % 1;
        const h = 20 + r * maxH;
        const w = bw * (0.55 + r2 * 0.5);
        const x = idx * bw - offset;
        c.rect(x, base - h, w, h + 4);
      }
      c.fill();

      // ventanitas encendidas
      c.fillStyle = 'rgba(255,205,120,.30)';
      for (let i = 0; i < n; i++) {
        const idx = start + i;
        const r = Math.abs(Math.sin(idx * 127.1 + maxH) * 43758.5453) % 1;
        const h = 20 + r * maxH;
        const x = idx * bw - offset;
        for (let k = 0; k < 4; k++) {
          const rr = Math.abs(Math.sin(idx * 57.3 + k * 13.7) * 9731.13) % 1;
          if (rr < 0.45) continue;
          c.fillRect(x + 5 + (k % 2) * 9, base - h + 8 + Math.floor(k / 2) * 12, 4, 6);
        }
      }
      c.restore();
    },

    // ------------------------- suelo --------------------------

    drawGround(dist) {
      const c = this.ctx, C = this.C;

      // balasto (base de las vías)
      this.quadXZ(0, -4.4, 4.4, this.NEAR, this.FAR);
      const gg = c.createLinearGradient(0, this.horizon, 0, this.H);
      gg.addColorStop(0, U.rgb(this.fog(C.ballast, 120)));
      gg.addColorStop(1, U.rgb(C.ballast));
      c.fillStyle = gg;
      c.fill();

      // Terreno lateral. Se extiende muy a los lados para que no aparezcan
      // huecos sin pintar cuando la cámara sube (jetpack, ir sobre un tren).
      // El ancho se calcula para que el llano llegue siempre al borde de la
      // pantalla, incluso con la cámara alta (jetpack o corriendo sobre un tren).
      const wide = this.W / (2 * this.scaleAt(this.FAR)) + 20;
      for (const sgn of [-1, 1]) {
        this.quadXZ(0, sgn * 4.4, sgn * wide, this.NEAR, this.FAR);
        const g2 = c.createLinearGradient(0, this.horizon, 0, this.H);
        g2.addColorStop(0, U.rgb(this.fog(U.hex('#4a4a68'), 110)));
        g2.addColorStop(0.35, U.rgb(U.hex('#333c58')));
        g2.addColorStop(1, U.rgb(U.hex('#242c42')));
        c.fillStyle = g2;
        c.fill();
      }

      // traviesas (de lejos a cerca para el pintor)
      const SP = 3.0, LEN = 1.0;
      const off = dist % SP;
      for (let z = this.FAR - off; z > this.NEAR; z -= SP) {
        if (z > 130) continue;
        const col = ((Math.round((z + off) / SP)) % 2) ? C.sleeper : U.shade(C.sleeper, 0.08);
        if (this.quadXZ(0.02, -4.0, 4.0, z, z + LEN)) this.fill(col, z);
      }

      // raíles de los 3 carriles
      for (const lx of World.LANES) {
        for (const s of [-0.62, 0.62]) {
          if (this.quadXZ(0.12, lx + s - 0.07, lx + s + 0.07, this.NEAR, 150)) {
            const rg = c.createLinearGradient(0, this.horizon, 0, this.H);
            rg.addColorStop(0, U.rgb(this.fog(C.rail, 130)));
            rg.addColorStop(0.6, U.rgb(U.shade(C.rail, -0.1)));
            rg.addColorStop(1, U.rgb(U.shade(C.rail, 0.15)));
            c.fillStyle = rg;
            c.fill();
          }
          // sombra bajo el raíl
          if (this.quadXZ(0.0, lx + s - 0.09, lx + s + 0.09, this.NEAR, 150)) {
            c.fillStyle = 'rgba(0,0,0,.28)';
            c.fill();
          }
        }
      }
    },

    /** Muros laterales, farolas y postes: decorado procedural. */
    drawScenery(dist) {
      const c = this.ctx, C = this.C;
      const SEG = 8;
      const off = dist % SEG;

      for (let i = Math.floor(this.FAR / SEG); i >= -1; i--) {
        const z1 = i * SEG - off, z2 = z1 + SEG;
        if (z2 <= this.NEAR) continue;
        const alt = (i % 2) === 0;

        for (const sgn of [-1, 1]) {
          const x = sgn * 4.5;
          // cara interior del muro
          if (this.quadZY(x, 0, 3.4, z1, z2)) this.fill(alt ? C.wall : C.wall2, z1);
          // franja superior clara
          if (this.quadZY(x, 3.4, 3.62, z1, z2)) this.fill(U.hex('#3d4766'), z1);
          // grafiti / paneles
          if ((i % 3) === 0 && this.quadZY(x, 0.6, 2.2, z1 + 1.4, z2 - 1.4)) {
            this.fill(U.mix(C.wall2, U.hex('#4bd8ff'), 0.18), z1);
          }
        }

        // farolas cada 3 segmentos
        if ((i % 3) === 1) {
          for (const sgn of [-1, 1]) {
            const x = sgn * 4.9, zc = z1 + SEG * 0.5;
            if (zc <= this.NEAR + 0.5) continue;
            if (this.quadZY(x, 0, 5.2, zc - 0.09, zc + 0.09)) this.fill(U.hex('#171d30'), zc);
            if (this.quadXY(zc, x - sgn * 0.7, x, 5.0, 5.25)) this.fill(U.hex('#171d30'), zc);
            // halo de la luz
            const p = this.proj(x - sgn * 0.55, 5.0, zc);
            const rr = Math.max(3, p.s * 0.55);
            const lg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 3);
            lg.addColorStop(0, 'rgba(255,226,170,.75)');
            lg.addColorStop(0.3, 'rgba(255,200,120,.20)');
            lg.addColorStop(1, 'rgba(255,190,110,0)');
            c.fillStyle = lg;
            c.beginPath();
            c.arc(p.x, p.y, rr * 3, 0, 6.2832);
            c.fill();
          }
        }
      }
    },

    // ---------------------- obstáculos ------------------------

    drawObstacle(o) {
      switch (o.kind) {
        case 'train':   return this.drawTrain(o);
        case 'barrier': return this.drawBarrier(o);
        case 'sign':    return this.drawSign(o);
        default:        return this.drawBlock(o);
      }
    },

    /** Caja genérica: cara lateral, techo y frontal (orden del pintor). */
    box(o, front, top, side) {
      const x1 = o.x - o.w / 2, x2 = o.x + o.w / 2;
      const y1 = o.y, y2 = o.y + o.h;
      let zN = o.z - o.d / 2;
      const zF = o.z + o.d / 2;
      if (zF <= this.NEAR) return null;
      if (zN < this.NEAR) zN = this.NEAR + 0.001;   // el "tapón" en el plano de recorte

      const cx = this.cam.x;
      const sideX = cx < x1 ? x1 : cx > x2 ? x2 : null;

      if (sideX !== null && this.quadZY(sideX, y1, y2, zN, zF)) this.fill(side, zN);
      if (this.cam.y > y2 && this.quadXZ(y2, x1, x2, zN, zF)) this.fill(top, zN);
      if (this.quadXY(zN, x1, x2, y1, y2)) this.fill(front, zN);

      return { x1, x2, y1, y2, zN, zF, sideX };
    },

    drawTrain(o) {
      const C = this.C;
      const body = o.variant ? C.trainAlt : C.train;
      const roof = U.shade(body, o.variant ? 0.1 : -0.04);
      const f = this.box(o, U.shade(body, -0.12), roof, U.shade(body, -0.28));
      if (!f) return;
      const c = this.ctx;
      const top = o.y + o.h;

      // detalle del techo: cenefas laterales y nervios transversales
      if (this.cam.y > top) {
        for (const sgn of [-1, 1]) {
          const xa = o.x + sgn * (o.w / 2 - 0.18), xb = o.x + sgn * (o.w / 2);
          if (this.quadXZ(top + 0.002, Math.min(xa, xb), Math.max(xa, xb), f.zN, f.zF)) {
            this.fill(U.shade(roof, -0.22), f.zN);
          }
        }
        for (let z = Math.ceil(f.zN / 3) * 3; z < f.zF; z += 3) {
          if (this.quadXZ(top + 0.004, o.x - o.w / 2 + 0.18, o.x + o.w / 2 - 0.18, z, z + 0.35)) {
            this.fill(U.shade(roof, -0.14), z);
          }
        }
      }

      // franja de color a lo largo del lateral y ventanas
      if (f.sideX !== null) {
        if (this.quadZY(f.sideX, 1.05, 1.55, f.zN, f.zF)) this.fill(U.shade(body, -0.5), f.zN);
        const step = 2.2;
        for (let z = Math.ceil((f.zN + 0.5) / step) * step; z < f.zF - 0.6; z += step) {
          if (this.quadZY(f.sideX, 1.12, 1.5, z, z + 1.3)) this.fill(C.glass, z);
        }
        // faldón inferior oscuro
        if (this.quadZY(f.sideX, 0, 0.35, f.zN, f.zF)) this.fill(U.hex('#20242f'), f.zN);
      }

      // frontal: parabrisas y faros
      if (this.quadXY(f.zN, f.x1 + 0.22, f.x2 - 0.22, 1.05, 1.62)) this.fill(C.glass, f.zN);
      if (this.quadXY(f.zN, f.x1 + 0.1, f.x2 - 0.1, 0.15, 0.4)) this.fill(U.shade(body, -0.55), f.zN);

      const s = this.scaleAt(f.zN);
      for (const sx of [-1, 1]) {
        const p = this.proj(o.x + sx * (o.w * 0.32), 0.62, f.zN);
        const r = Math.max(2, s * 0.13);
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        g.addColorStop(0, 'rgba(255,255,230,.95)');
        g.addColorStop(0.28, 'rgba(255,238,180,.35)');
        g.addColorStop(1, 'rgba(255,230,160,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(p.x, p.y, r * 4, 0, 6.2832);
        c.fill();
      }
    },

    drawBarrier(o) {
      const C = this.C;
      const f = this.box(o, C.barrier, U.shade(C.barrier, 0.18), U.shade(C.barrier, -0.3));
      if (!f) return;
      // franjas diagonales de advertencia sobre la cara frontal
      const n = 5;
      for (let i = 0; i < n; i++) {
        if (i % 2) continue;
        const a = f.x1 + (f.x2 - f.x1) * (i / n);
        const b = f.x1 + (f.x2 - f.x1) * ((i + 0.55) / n);
        if (this.quadXY(f.zN, a, b, o.y + 0.08, o.y + o.h - 0.08)) this.fill(U.hex('#22262f'), f.zN);
      }
      // patas
      for (const sx of [-1, 1]) {
        const px = o.x + sx * (o.w * 0.42);
        if (this.quadXY(f.zN, px - 0.06, px + 0.06, 0, o.y)) this.fill(U.hex('#2a2f3d'), f.zN);
      }
    },

    drawSign(o) {
      const C = this.C;
      const f = this.box(o, C.sign, U.shade(C.sign, 0.15), U.shade(C.sign, -0.3));
      if (!f) return;
      if (this.quadXY(f.zN, f.x1 + 0.12, f.x2 - 0.12, o.y + 0.18, o.y + o.h - 0.18)) {
        this.fill(U.hex('#f6f2e8'), f.zN);
      }
      if (this.quadXY(f.zN - 0.001, f.x1 + 0.3, f.x2 - 0.3, o.y + o.h * 0.42, o.y + o.h * 0.62)) {
        this.fill(C.sign, f.zN);
      }
      // soportes hasta el techo
      for (const sx of [-1, 1]) {
        const px = o.x + sx * (o.w * 0.44);
        if (this.quadXY(f.zN, px - 0.05, px + 0.05, o.y + o.h, 3.4)) this.fill(U.hex('#2a2f3d'), f.zN);
      }
    },

    drawBlock(o) {
      const C = this.C;
      const f = this.box(o, C.block, U.shade(C.block, 0.2), U.shade(C.block, -0.3));
      if (!f) return;
      for (let i = 0; i < 3; i++) {
        const y = o.y + o.h * (0.22 + i * 0.28);
        if (this.quadXY(f.zN, f.x1 + 0.1, f.x2 - 0.1, y, y + 0.1)) this.fill(U.hex('#39415c'), f.zN);
      }
    },

    // ------------------------ monedas -------------------------

    drawCoin(coin) {
      if (coin.z <= this.NEAR + 0.3) return;
      const c = this.ctx;
      const p = this.proj(coin.x, coin.y, coin.z);
      const r = Math.max(1.2, p.s * 0.24);
      const spin = Math.abs(Math.cos(coin.phase));
      const rx = Math.max(0.6, r * (0.18 + spin * 0.82));

      c.save();
      // resplandor
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
      g.addColorStop(0, 'rgba(255,214,80,.42)');
      g.addColorStop(1, 'rgba(255,200,60,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, r * 2.4, 0, 6.2832);
      c.fill();

      const grad = c.createLinearGradient(p.x - rx, p.y - r, p.x + rx, p.y + r);
      grad.addColorStop(0, '#fff3b0');
      grad.addColorStop(0.45, '#ffcf3d');
      grad.addColorStop(1, '#d99312');
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(p.x, p.y, rx, r, 0, 0, 6.2832);
      c.fill();

      if (rx > 2.5) {
        c.strokeStyle = 'rgba(255,255,255,.55)';
        c.lineWidth = Math.max(0.6, r * 0.12);
        c.beginPath();
        c.ellipse(p.x, p.y, rx * 0.62, r * 0.62, 0, 0, 6.2832);
        c.stroke();
      }
      c.restore();
    },

    drawPickup(pk) {
      if (pk.z <= this.NEAR + 0.3) return;
      const c = this.ctx;
      const p = this.proj(pk.x, pk.y, pk.z);
      const r = Math.max(3, p.s * 0.42);
      const col = pk.color;

      c.save();
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
      g.addColorStop(0, U.rgb(col, 0.55));
      g.addColorStop(1, U.rgb(col, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, r * 2.6, 0, 6.2832);
      c.fill();

      c.translate(p.x, p.y);
      c.rotate(pk.phase * 0.7);
      c.fillStyle = U.rgb(col, 0.9);
      c.strokeStyle = 'rgba(255,255,255,.85)';
      c.lineWidth = Math.max(1, r * 0.1);
      c.beginPath();
      c.roundRect(-r, -r, r * 2, r * 2, r * 0.32);
      c.fill();
      c.stroke();
      c.rotate(-pk.phase * 0.7);

      c.fillStyle = '#10131f';
      c.font = `900 ${Math.round(r * 1.25)}px ${'Segoe UI, sans-serif'}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(pk.icon, 0, r * 0.06);
      c.restore();
    },

    // ---------------------- personajes ------------------------

    /** Paleta del uniforme del guardia. */
    GUARD_PAL: {
      skin: '#d9a273', cloth: '#2b4a86', cloth2: '#3f66ad', pants: '#1b2540',
      shoe: '#20242f', cap: '#16223f', pack: '#2b4a86', pack2: '#1e3767',
    },

    drawPlayer(pl) {
      const ch = Store.char();
      this.figure(pl, ch.pal, ch.style, pl, 1);
    },

    /** El guardia que persigue: misma silueta, uniforme azul y más corpulento. */
    drawGuard(g) {
      this.figure(g, this.GUARD_PAL, 'guard', null, 1.14);
    },

    /**
     * Dibuja un corredor completo con proyección en perspectiva.
     * fig   → { x, y, z, support, sliding, runPhase }
     * pal   → paleta de colores del personaje
     * style → silueta de la cabeza: cap | ponytail | beanie | hood | halo | guard
     * fx    → temporizadores de potenciadores (null si no aplica)
     * bulk  → factor de corpulencia
     */
    figure(fig, pal, style, fx, bulk) {
      const c = this.ctx;
      const sr = this.scaleAt(fig.z);
      if (!isFinite(sr) || sr <= 0) return;
      const s = sr * (bulk || 1);
      const px = this.W / 2 + (fig.x - this.cam.x) * sr;
      const feet = this.horizon + (this.cam.y - fig.y) * sr;

      const t = fig.runPhase || 0;
      const sliding = !!fig.sliding;
      const support = fig.support || 0;
      const airborne = fig.y > support + 0.05;
      const jet = fx && fx.jet > 0;

      const swing = airborne ? 0 : Math.sin(t) * 0.36;
      const swing2 = airborne ? 0 : Math.sin(t + Math.PI) * 0.36;
      const bob = airborne || sliding ? 0 : Math.abs(Math.sin(t)) * 0.05;

      // coordenadas locales: X(dx) lateral, HB(h) altura sobre los pies
      const X = (dx) => px + dx * s;
      const HB = (h) => feet - (h + bob) * s;

      // ---- sombra sobre el suelo o el techo del tren ----
      const shY = this.horizon + (this.cam.y - support) * sr;
      const air = U.clamp((fig.y - support) / 2.4, 0, 1);
      c.save();
      c.globalAlpha = 0.42 * (1 - air * 0.7);
      c.fillStyle = '#000';
      c.beginPath();
      c.ellipse(px, shY, s * 0.42 * (1 - air * 0.3), s * 0.15 * (1 - air * 0.3), 0, 0, 6.2832);
      c.fill();
      c.restore();

      // proporciones (unidades de mundo medidas desde los pies)
      let hipH = 0.80, headH = 1.52, torsoTop = 1.30;
      if (sliding) { hipH = 0.30; headH = 0.70; torsoTop = 0.52; }

      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';

      // ================= auras de potenciadores =================
      if (fx) {
        if (fx.shield > 0) {
          const cy = HB(0.85), rr = s * 0.9;
          const g = c.createRadialGradient(px, cy, rr * 0.3, px, cy, rr);
          g.addColorStop(0, 'rgba(75,216,255,.05)');
          g.addColorStop(0.75, 'rgba(75,216,255,.22)');
          g.addColorStop(1, 'rgba(140,235,255,.55)');
          c.fillStyle = g;
          c.beginPath();
          c.ellipse(px, cy, rr * 0.72, rr, 0, 0, 6.2832);
          c.fill();
        }
        if (fx.magnet > 0) {
          c.strokeStyle = 'rgba(168,107,255,.55)';
          c.lineWidth = Math.max(1, s * 0.05);
          for (let i = 0; i < 3; i++) {
            const rr = s * (0.5 + i * 0.28 + (fx.auraPhase % 1) * 0.25);
            c.globalAlpha = 0.55 - i * 0.15;
            c.beginPath();
            c.ellipse(px, HB(0.8), rr, rr * 0.34, 0, 0, 6.2832);
            c.stroke();
          }
          c.globalAlpha = 1;
        }
        if (fx.boost > 0) {
          c.strokeStyle = 'rgba(69,224,138,.5)';
          c.lineWidth = Math.max(1, s * 0.04);
          c.beginPath();
          c.ellipse(px, HB(0.05), s * 0.55, s * 0.2, 0, 0, 6.2832);
          c.stroke();
        }
      }

      // ================= jetpack (detrás del cuerpo) =============
      if (jet) {
        const flick = 0.75 + Math.abs(Math.sin(t * 3.1)) * 0.55;
        for (const sgn of [-1, 1]) {
          const fxp = X(sgn * 0.22), fy = HB(hipH - 0.02);
          const g = c.createLinearGradient(fxp, fy, fxp, fy + s * 0.9 * flick);
          g.addColorStop(0, 'rgba(255,255,220,.95)');
          g.addColorStop(0.35, 'rgba(255,168,60,.85)');
          g.addColorStop(1, 'rgba(255,80,40,0)');
          c.fillStyle = g;
          c.beginPath();
          c.ellipse(fxp, fy + s * 0.34 * flick, s * 0.12, s * 0.42 * flick, 0, 0, 6.2832);
          c.fill();
        }
        c.fillStyle = '#3a4152';
        c.beginPath();
        c.roundRect(X(-0.32), HB(torsoTop + 0.04), s * 0.64, s * 0.62, s * 0.1);
        c.fill();
        c.fillStyle = '#ff8a3d';
        c.beginPath();
        c.roundRect(X(-0.26), HB(torsoTop - 0.02), s * 0.52, s * 0.12, s * 0.05);
        c.fill();
      }

      // ======================== piernas =========================
      c.lineWidth = s * 0.155;
      c.strokeStyle = pal.pants;
      const legs = sliding
        ? [[-0.30, 0.05], [0.34, 0.07]]        // agachado: rodillas abiertas
        : jet
          ? [[-0.16, 0.34], [0.18, 0.30]]      // volando: piernas colgando
          : airborne
            ? [[0.34, 0.30], [-0.10, 0.55]]    // en el aire: piernas recogidas
            : [[swing, 0.06], [swing2, 0.06]]; // zancada

      const bootsOn = fx && fx.boots > 0;
      for (let i = 0; i < 2; i++) {
        const [dx, kneeLift] = legs[i];
        c.globalAlpha = i === 0 ? 0.75 : 1;
        c.beginPath();
        c.moveTo(X(0), HB(hipH));
        c.lineTo(X(dx * 0.55), HB(hipH * 0.5 + kneeLift * 0.25));
        c.lineTo(X(dx), HB(kneeLift));
        c.stroke();

        c.save();
        c.globalAlpha = i === 0 ? 0.8 : 1;
        if (bootsOn) {
          c.shadowColor = '#ff5ac8';
          c.shadowBlur = s * 0.35;
        }
        c.fillStyle = bootsOn ? '#ff5ac8' : pal.shoe;
        c.beginPath();
        c.ellipse(X(dx + 0.05), HB(kneeLift * 0.6),
                  s * (bootsOn ? 0.17 : 0.13), s * (bootsOn ? 0.09 : 0.07), 0, 0, 6.2832);
        c.fill();
        c.restore();
      }
      c.globalAlpha = 1;

      // ============ mochila (joroba a la espalda) ===============
      if (!jet) {
        const packY = sliding ? torsoTop + 0.05 : hipH + (torsoTop - hipH) * 0.62;
        const packRx = sliding ? 0.30 : 0.34;
        const packRy = sliding ? 0.16 : 0.30;
        c.fillStyle = pal.pack2;
        c.beginPath();
        c.ellipse(X(0), HB(packY), s * packRx, s * packRy, 0, 0, 6.2832);
        c.fill();
        c.fillStyle = pal.pack;
        c.beginPath();
        c.ellipse(X(0), HB(packY + 0.02), s * packRx * 0.85, s * packRy * 0.8, 0, 0, 6.2832);
        c.fill();
      }

      // ========================= torso ==========================
      const bodyGrad = c.createLinearGradient(X(-0.3), HB(torsoTop), X(0.3), HB(hipH));
      bodyGrad.addColorStop(0, pal.cloth2);
      bodyGrad.addColorStop(1, pal.cloth);
      c.fillStyle = bodyGrad;
      c.beginPath();
      c.moveTo(X(-0.24), HB(hipH - 0.04));
      c.lineTo(X(-0.27), HB(torsoTop));
      c.lineTo(X(0.27), HB(torsoTop));
      c.lineTo(X(0.24), HB(hipH - 0.04));
      c.closePath();
      c.fill();

      if (style === 'guard') {           // placa reflectante del uniforme
        c.fillStyle = 'rgba(255,220,120,.85)';
        c.fillRect(X(-0.24), HB(hipH + 0.28), s * 0.48, s * 0.09);
      }

      // ========================= brazos =========================
      c.lineWidth = s * 0.115;
      c.strokeStyle = pal.cloth;
      const arms = sliding
        ? [[-0.46, 0.26], [0.48, 0.22]]
        : jet
          ? [[-0.46, hipH + 0.30], [0.48, hipH + 0.30]]
          : airborne
            ? [[-0.42, 0.95], [0.44, 0.92]]
            : [[-0.40 + swing2 * 0.25, hipH + 0.20 + swing2 * 0.35],
               [0.40 + swing * 0.25, hipH + 0.20 + swing * 0.35]];
      for (let i = 0; i < 2; i++) {
        const [dx, hy] = arms[i];
        c.globalAlpha = i === 0 ? 0.7 : 1;
        c.beginPath();
        c.moveTo(X(0), HB(torsoTop - 0.06));
        c.lineTo(X(dx * 0.6), HB((torsoTop + hy) / 2 - 0.02));
        c.lineTo(X(dx), HB(hy));
        c.stroke();
        c.fillStyle = pal.skin;
        c.beginPath();
        c.arc(X(dx), HB(hy), s * 0.07, 0, 6.2832);
        c.fill();
        c.strokeStyle = pal.cloth;
      }
      c.globalAlpha = 1;

      // ========================= cabeza =========================
      const hx = X(0), hy = HB(headH - 0.04), hr = s * 0.145;

      if (style === 'ponytail') {        // coleta por detrás
        c.fillStyle = pal.cap;
        c.beginPath();
        c.ellipse(hx, hy + hr * 0.5, hr * 0.55, hr * 1.5, 0, 0, 6.2832);
        c.fill();
      }
      if (style === 'hood') {            // capucha rodeando la cabeza
        c.fillStyle = pal.cap;
        c.beginPath();
        c.arc(hx, hy, hr * 1.42, 0, 6.2832);
        c.fill();
      }

      c.fillStyle = pal.skin;
      c.beginPath();
      c.arc(hx, hy, hr, 0, 6.2832);
      c.fill();

      switch (style) {
        case 'hood':
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.18, hr * 1.3, Math.PI, 0);
          c.fill();
          break;
        case 'beanie':
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.1, hr * 1.12, Math.PI, 0);
          c.fill();
          c.fillRect(hx - hr * 1.12, hy - hr * 0.22, hr * 2.24, hr * 0.34);
          c.beginPath();
          c.arc(hx, hy - hr * 1.15, hr * 0.4, 0, 6.2832);   // pompón
          c.fill();
          break;
        case 'ponytail':
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.12, hr * 1.1, Math.PI, 0);
          c.fill();
          break;
        case 'halo':
          c.strokeStyle = 'rgba(255,240,160,.9)';
          c.lineWidth = Math.max(1.2, hr * 0.22);
          c.beginPath();
          c.ellipse(hx, hy - hr * 1.55, hr * 0.95, hr * 0.3, 0, 0, 6.2832);
          c.stroke();
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.15, hr * 1.05, Math.PI, 0);
          c.fill();
          break;
        case 'guard':
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.2, hr * 1.15, Math.PI, 0);
          c.fill();
          c.beginPath();
          c.ellipse(hx, hy - hr * 0.24, hr * 1.4, hr * 0.34, 0, 0, 6.2832);
          c.fill();
          c.fillStyle = 'rgba(255,220,120,.9)';            // insignia
          c.beginPath();
          c.arc(hx, hy - hr * 0.75, hr * 0.22, 0, 6.2832);
          c.fill();
          break;
        default:                                            // 'cap'
          c.fillStyle = pal.cap;
          c.beginPath();
          c.arc(hx, hy - hr * 0.2, hr * 1.07, Math.PI, 0);
          c.fill();
          c.beginPath();
          c.ellipse(hx, hy - hr * 0.24, hr * 1.28, hr * 0.34, 0, 0, 6.2832);
          c.fill();
      }

      c.restore();
    },
    // ----------------------- partículas -----------------------

    drawParticles(list) {
      const c = this.ctx;
      for (const p of list) {
        if (p.z <= this.NEAR + 0.2) continue;
        const q = this.proj(p.x, p.y, p.z);
        const r = Math.max(0.6, q.s * p.size);
        c.globalAlpha = U.clamp(p.life / p.max, 0, 1) * (p.alpha || 1);
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(q.x, q.y, r, 0, 6.2832);
        c.fill();
      }
      c.globalAlpha = 1;
    },

    /** Líneas de velocidad en los bordes cuando se corre muy rápido. */
    drawSpeedLines(intensity, t) {
      if (intensity <= 0.01) return;
      const c = this.ctx;
      c.save();
      c.globalAlpha = intensity * 0.4;
      c.strokeStyle = '#cfe6ff';
      c.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const r = Math.abs(Math.sin(i * 91.7 + Math.floor(t * 18) * 0.37)) % 1;
        const side = i % 2 ? 1 : -1;
        const x = this.W / 2 + side * (this.W * (0.30 + r * 0.22));
        const y = this.horizon + r * (this.H - this.horizon);
        const len = 40 + r * 120;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + side * 26, y + len);
        c.stroke();
      }
      c.restore();
    },

    /** Viñeta + tinte según el estado. */
    drawVignette(tint) {
      const c = this.ctx;
      const g = c.createRadialGradient(this.W / 2, this.H * 0.5, this.H * 0.28, this.W / 2, this.H * 0.5, this.H * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.55)');
      c.fillStyle = g;
      c.fillRect(0, 0, this.W, this.H);
      if (tint) {
        c.fillStyle = tint;
        c.fillRect(0, 0, this.W, this.H);
      }
    },
  };

  /* ---------- js/world.js ---------- */
  /* ============================================================
     world.js — generación procedural del recorrido.

     El mundo se crea por "bloques" (chunks). Cada bloque garantiza
     al menos un carril libre, y ese carril libre nunca está a más
     de un carril de distancia del anterior: así todo es superable.
     ============================================================ */
  'use strict';

  const World = {
    LANES: [-2, 0, 2],
    lastFree: 1,

    reset() { this.lastFree = 1; },

    // ------------------------ fábricas ------------------------

    /**
     * ride:true  → se puede aterrizar encima (trenes)
     * gapBottom  → altura libre por debajo (carteles: pasar deslizándose)
     */
    make(kind, lane, z) {
      const x = this.LANES[lane];
      switch (kind) {
        case 'train':
          return { kind, lane, x, y: 0, w: 1.75, h: 1.9,
                   d: U.rand(14, 24), z: 0, ride: true, variant: U.chance(0.35), _z0: z };
        case 'barrier':
          return { kind, lane, x, y: 0, w: 1.8, h: 0.95, d: 0.5, z: z + 0.25, ride: false };
        case 'sign':
          return { kind, lane, x, y: 1.45, w: 1.9, h: 1.7, d: 0.4, z: z + 0.2, ride: false };
        default: // 'block' — contenedor demasiado alto para saltar
          return { kind: 'block', lane, x, y: 0, w: 1.7, h: 2.7, d: 2.4, z: z + 1.2, ride: false };
      }
    },

    coin(lane, z, y) {
      return { x: this.LANES[lane], y: y === undefined ? 0.62 : y, z,
               phase: Math.random() * 6.28, dead: false, vx: 0, vy: 0, vz: 0 };
    },

    pickup(type, lane, z) {
      const cfg = Store.UPGRADES[type];
      return { type, x: this.LANES[lane], y: 0.95, z, icon: cfg.icon,
               color: U.hex(cfg.color), phase: 0, dead: false };
    },

    // ---------------------- generación ------------------------

    pickFree() {
      const options = [this.lastFree];
      if (this.lastFree > 0) options.push(this.lastFree - 1);
      if (this.lastFree < 2) options.push(this.lastFree + 1);
      const free = U.pick(options);
      this.lastFree = free;
      return free;
    },

    /** Crea un bloque de recorrido en g.spawnZ y devuelve su longitud. */
    spawnChunk(g) {
      const z = g.spawnZ;
      const d = U.clamp((g.dist - 120) / 1800, 0, 1);   // dificultad 0 → 1
      let len = 26 + g.speed * 0.5;

      const type = U.pickWeighted([
        ['normal',    70],
        ['trainYard', 10 + d * 14],
        ['jumpAll',    5 + d * 12],
        ['slideAll',   5 + d * 12],
      ]);

      const free = this.pickFree();

      if (type === 'jumpAll' || type === 'slideAll') {
        // Muro completo: pasa por cualquier carril, pero obliga a saltar o deslizarse.
        const kind = type === 'jumpAll' ? 'barrier' : 'sign';
        for (let l = 0; l < 3; l++) g.obstacles.push(this.make(kind, l, z + 6));
        // Recompensa: monedas justo después, a la altura correcta.
        const cy = type === 'jumpAll' ? 1.5 : 0.45;
        for (let i = 0; i < 5; i++) g.coins.push(this.coin(free, z + 8 + i * 1.8, cy));
        len = Math.max(len, 30);
      } else if (type === 'trainYard') {
        // Trenes en los dos carriles ocupados.
        let maxEnd = z;
        for (let l = 0; l < 3; l++) {
          if (l === free) continue;
          const t = this.make('train', l, z);
          t.z = z + 2 + t.d / 2;
          g.obstacles.push(t);
          maxEnd = Math.max(maxEnd, t.z + t.d / 2);
          if (U.chance(0.45)) this.coinLine(g, l, t.z - t.d / 2 + 2, 6, 2.6); // botín encima
        }
        this.coinLine(g, free, z + 3, U.randInt(5, 9), 0.62);
        len = Math.max(len, maxEnd - z + 6);
      } else {
        // Bloque normal: cada carril ocupado recibe (o no) un obstáculo.
        let maxEnd = z;
        for (let l = 0; l < 3; l++) {
          if (l === free) continue;
          if (!U.chance(0.42 + d * 0.46)) continue;

          const kind = U.pickWeighted([
            ['barrier', 30],
            ['sign',    12 + d * 12],
            ['train',   14 + d * 16],
            ['block',    8 + d * 12],
          ]);
          const o = this.make(kind, l, z + U.rand(1, 5));
          if (kind === 'train') {
            o.z = z + 2 + o.d / 2;
            maxEnd = Math.max(maxEnd, o.z + o.d / 2);
            if (U.chance(0.3)) this.coinLine(g, l, o.z - o.d / 2 + 2, 5, 2.6);
          } else {
            maxEnd = Math.max(maxEnd, o.z + o.d / 2);
          }
          g.obstacles.push(o);
        }
        // Monedas en el carril libre (línea recta o arco de salto).
        if (U.chance(0.85)) {
          if (U.chance(0.28)) this.coinArc(g, free, z + 4);
          else this.coinLine(g, free, z + 3, U.randInt(4, 9), 0.62);
        }
        len = Math.max(len, maxEnd - z + 5);
      }

      // Potenciador cada cierto número de bloques.
      g.chunkCount++;
      if (g.chunkCount - g.lastPowerChunk >= U.randInt(5, 9)) {
        g.lastPowerChunk = g.chunkCount;
        const type = U.pickWeighted([
          ['magnet', 3], ['shield', 2.6], ['boost', 2.2], ['boots', 1.8], ['jet', 1.2],
        ]);
        g.pickups.push(this.pickup(type, free, z + len * 0.5));
      }

      return len;
    },

    coinLine(g, lane, z0, n, y) {
      for (let i = 0; i < n; i++) g.coins.push(this.coin(lane, z0 + i * 2.0, y));
    },

    /** Arco de monedas que dibuja la trayectoria de un salto. */
    coinArc(g, lane, z0) {
      const n = 9;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const y = 0.55 + Math.sin(t * Math.PI) * 1.55;
        g.coins.push(this.coin(lane, z0 + i * 1.8, y));
      }
    },
  };

  /* ---------- js/shop.js ---------- */
  /* ============================================================
     shop.js — tienda: elegir/comprar personajes y subir de nivel
     los potenciadores gastando el banco de monedas.
     ============================================================ */
  'use strict';

  const Shop = {
    el: {},
    tab: 'chars',
    from: 'menu',          // pantalla a la que se vuelve al salir

    init() {
      this.el = {
        screen: document.getElementById('screen-shop'),
        bank:   document.getElementById('shop-bank'),
        chars:  document.getElementById('tab-chars'),
        ups:    document.getElementById('tab-ups'),
        tabs:   Array.from(document.querySelectorAll('.tab')),
      };

      for (const t of this.el.tabs) {
        t.addEventListener('click', () => this.showTab(t.dataset.tab));
      }
      document.getElementById('btn-shop').addEventListener('click', () => this.open('menu'));
      document.getElementById('btn-shop2').addEventListener('click', () => this.open('over'));
      document.getElementById('btn-shop-back').addEventListener('click', () => this.close());

      // Delegación de eventos: los botones se regeneran en cada dibujado.
      this.el.chars.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-char]');
        if (btn) this.onChar(btn.dataset.char);
      });
      this.el.ups.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-up]');
        if (btn) this.onUpgrade(btn.dataset.up);
      });
    },

    open(from) {
      this.from = from || 'menu';
      Sound.init();
      Game.el.start.classList.add('hidden');
      Game.el.over.classList.add('hidden');
      this.render();
      this.el.screen.classList.remove('hidden');
    },

    close() {
      this.el.screen.classList.add('hidden');
      if (this.from === 'over') Game.el.over.classList.remove('hidden');
      else Game.toMenu();
    },

    showTab(name) {
      this.tab = name;
      for (const t of this.el.tabs) t.classList.toggle('active', t.dataset.tab === name);
      this.el.chars.classList.toggle('hidden', name !== 'chars');
      this.el.ups.classList.toggle('hidden', name !== 'ups');
    },

    // ----------------------- interacción ----------------------

    onChar(id) {
      if (Store.owns(id)) {
        if (Store.data.selected !== id) { Store.select(id); Sound.lane(); }
      } else if (Store.buyChar(id)) {
        Sound.power();
      } else {
        Sound.tone({ freq: 200, to: 120, type: 'square', dur: 0.18, vol: 0.14 });
      }
      this.render();
    },

    onUpgrade(key) {
      if (Store.buyUpgrade(key)) Sound.power();
      else Sound.tone({ freq: 200, to: 120, type: 'square', dur: 0.18, vol: 0.14 });
      this.render();
    },

    // ------------------------- dibujado -----------------------

    render() {
      this.el.bank.textContent = U.fmt(Store.data.bank);
      this.renderChars();
      this.renderUps();
    },

    renderChars() {
      const bank = Store.data.bank;
      const html = Store.CHARS.map((ch) => {
        const owned = Store.owns(ch.id);
        const active = Store.data.selected === ch.id;
        const afford = bank >= ch.price;

        let btn;
        if (active)      btn = `<button class="card-btn on" data-char="${ch.id}">EN USO</button>`;
        else if (owned)  btn = `<button class="card-btn" data-char="${ch.id}">USAR</button>`;
        else if (afford) btn = `<button class="card-btn" data-char="${ch.id}">${U.fmt(ch.price)} 🪙</button>`;
        else             btn = `<button class="card-btn ghost" data-char="${ch.id}" disabled>${U.fmt(ch.price)} 🪙</button>`;

        return `
          <div class="card ${active ? 'selected' : ''} ${owned ? '' : 'locked'}">
            ${!owned && afford ? '<span class="tag-new">¡YA!</span>' : ''}
            ${this.avatar(ch)}
            <div class="cname">${ch.name}</div>
            <div class="ctag">${ch.tag}</div>
            <div class="cperk">${ch.perkText}</div>
            ${btn}
          </div>`;
      }).join('');
      this.el.chars.innerHTML = `<div class="chars">${html}</div>`;
    },

    renderUps() {
      const bank = Store.data.bank;
      const rows = Object.keys(Store.UPGRADES).map((key) => {
        const u = Store.UPGRADES[key];
        const lv = Store.level(key);
        const cost = Store.upgradeCost(key);
        const now = (u.base + u.step * (lv - 1)).toFixed(1);
        const next = cost === null ? null : (u.base + u.step * lv).toFixed(1);

        const dots = Array.from({ length: u.max },
          (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');

        const btn = cost === null
          ? '<button class="up-btn maxed" disabled>MÁXIMO</button>'
          : `<button class="up-btn" data-up="${key}" ${bank >= cost ? '' : 'disabled'}>${U.fmt(cost)} 🪙</button>`;

        const dur = next
          ? `${now} s → <em>${next} s</em>`
          : `${now} s`;

        return `
          <div class="up-row" style="--c:${u.color}">
            <span class="up-ico">${u.icon}</span>
            <div class="up-info">
              <b>${u.name}</b>
              <span>${u.desc}</span>
              <div class="dots">${dots}</div>
            </div>
            <div class="up-buy">
              <span class="up-dur">${dur}</span>
              ${btn}
            </div>
          </div>`;
      }).join('');
      this.el.ups.innerHTML = `<div class="ups">${rows}</div>`;
    },

    /** Miniatura SVG del personaje construida a partir de su paleta. */
    avatar(ch) {
      const p = ch.pal;
      const st = ch.style;

      const hair = st === 'ponytail'
        ? `<ellipse cx="24" cy="25" rx="4.2" ry="9" fill="${p.cap}"/>` : '';
      const hood = st === 'hood'
        ? `<circle cx="24" cy="20" r="10.6" fill="${p.cap}"/>` : '';

      let hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
                 <ellipse cx="24" cy="19.4" rx="10" ry="2.5" fill="${p.cap}"/>`;
      if (st === 'beanie') {
        hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
               <rect x="16" y="18.4" width="16" height="3.2" rx="1.4" fill="${p.cap}"/>
               <circle cx="24" cy="10.4" r="3" fill="${p.cap}"/>`;
      } else if (st === 'hood' || st === 'ponytail') {
        hat = `<path d="M16 19.5a8 8 0 0 1 16 0z" fill="${p.cap}"/>`;
      } else if (st === 'halo') {
        hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
               <ellipse cx="24" cy="8" rx="7" ry="2.2" fill="none"
                        stroke="rgba(255,240,160,.95)" stroke-width="2"/>`;
      }

      return `
        <svg class="avatar" viewBox="0 0 48 64" aria-hidden="true">
          <defs>
            <linearGradient id="g-${ch.id}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="${p.cloth2}"/>
              <stop offset="1" stop-color="${p.cloth}"/>
            </linearGradient>
          </defs>
          <ellipse cx="24" cy="61" rx="13" ry="2.6" fill="rgba(0,0,0,.35)"/>
          <rect x="18.5" y="43" width="5" height="15" rx="2.5" fill="${p.pants}"/>
          <rect x="24.5" y="43" width="5" height="15" rx="2.5" fill="${p.pants}"/>
          <ellipse cx="19.5" cy="58.5" rx="4.6" ry="2.6" fill="${p.shoe}"/>
          <ellipse cx="28.5" cy="58.5" rx="4.6" ry="2.6" fill="${p.shoe}"/>
          <ellipse cx="24" cy="36" rx="10.5" ry="8.5" fill="${p.pack2}"/>
          <ellipse cx="24" cy="35" rx="8.8" ry="6.8" fill="${p.pack}"/>
          <path d="M16 44 L15 28 H33 L32 44 Z" fill="url(#g-${ch.id})"/>
          <path d="M19 30 L12.5 42" stroke="${p.cloth}" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M29 30 L35.5 42" stroke="${p.cloth}" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="12.5" cy="42" r="2.6" fill="${p.skin}"/>
          <circle cx="35.5" cy="42" r="2.6" fill="${p.skin}"/>
          ${hair}${hood}
          <circle cx="24" cy="20" r="7.5" fill="${p.skin}"/>
          ${hat}
        </svg>`;
    },
  };

  /* ---------- js/game.js ---------- */
  /* ============================================================
     game.js — bucle principal, física, colisiones, entrada y UI.
     ============================================================ */
  'use strict';

  const Game = {
    // ------------------------ constantes ----------------------
    GRAVITY: 30,
    JUMP_V: 11.6,          // apogeo ≈ 2.24 → justo por encima de un tren (1.9)
    BOOTS_MUL: 1.34,       // súper zapatillas: apogeo ≈ 4.0
    JET_H: 3.7,            // altura de vuelo del jetpack (por encima de todo)
    SLIDE_TIME: 0.62,
    SPEED0: 20,
    SPEED_MAX: 46,
    ACCEL: 0.42,
    SPAWN_AHEAD: 175,
    P_HALF_W: 0.34,
    P_HALF_D: 0.32,
    H_STAND: 1.70,
    H_SLIDE: 0.85,

    POWERS: ['magnet', 'shield', 'boost', 'jet', 'boots'],

    // ---- persecución del guardia ----
    CHASE_DECAY: 0.30,     // el guardia se descuelga en ~3,3 s
    CHASE_FATAL: 0.60,     // tropezar por encima de este nivel = te atrapa

    // -------------------------- estado ------------------------
    state: 'menu',
    t: 0, last: 0, dyingT: 0,
    speed: 0, dist: 0, score: 0, coinCount: 0, best: 0,
    spawnZ: 0, chunkCount: 0, lastPowerChunk: 0, coinStreak: 0,
    chase: 0, guardSide: 1, caught: false,
    newRecord: false,
    obstacles: [], coins: [], pickups: [], particles: [], drawList: [],
    player: null, guard: null,
    el: {},

    // ============================================================
    //  Arranque
    // ============================================================
    init() {
      R.init(document.getElementById('game'));
      Store.load();

      this.el = {
        hud:      document.getElementById('hud'),
        score:    document.getElementById('hud-score'),
        dist:     document.getElementById('hud-dist'),
        coins:    document.getElementById('hud-coins'),
        mult:     document.getElementById('hud-mult'),
        powers:   document.getElementById('hud-powers'),
        start:    document.getElementById('screen-start'),
        pause:    document.getElementById('screen-pause'),
        over:     document.getElementById('screen-over'),
        flash:    document.getElementById('flash'),
        startBest:document.getElementById('start-best'),
        startBank:document.getElementById('start-bank'),
        oScore:   document.getElementById('over-score'),
        oDist:    document.getElementById('over-dist'),
        oCoins:   document.getElementById('over-coins'),
        oBest:    document.getElementById('over-best'),
        oEarned:  document.getElementById('over-earned'),
        oBank:    document.getElementById('over-bank'),
        oTitle:   document.querySelector('.over-title'),
        record:   document.getElementById('new-record'),
        btnSound: document.getElementById('btn-sound'),
      };

      this.best = Store.data.best;
      this.refreshMenuStats();

      this.buildPowerIcons();
      this.buildChaseWarning();
      Shop.init();
      this.bindUI();
      this.bindInput();

      this.resetRun();          // mundo de fondo para el menú
      this.last = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    },

    refreshMenuStats() {
      this.el.startBest.textContent = U.fmt(this.best);
      this.el.startBank.textContent = U.fmt(Store.data.bank);
    },

    buildPowerIcons() {
      this.powerEls = {};
      for (const key of this.POWERS) {
        const cfg = Store.UPGRADES[key];
        const d = document.createElement('div');
        d.className = 'power hidden';
        d.style.setProperty('--c', cfg.color);
        d.innerHTML = `<span>${cfg.icon}</span><i class="bar"></i>`;
        this.el.powers.appendChild(d);
        this.powerEls[key] = { root: d, bar: d.querySelector('.bar') };
      }
    },

    buildChaseWarning() {
      const w = document.createElement('div');
      w.id = 'chase-warn';
      w.className = 'hidden';
      w.textContent = '¡EL GUARDIA!';
      this.el.hud.appendChild(w);
      this.el.warn = w;
    },

    bindUI() {
      const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
      on('btn-play',   () => this.start());
      on('btn-retry',  () => this.start());
      on('btn-menu',   () => this.toMenu());
      on('btn-resume', () => this.resume());
      on('btn-quit',   () => this.toMenu());
      on('btn-pause',  () => this.togglePause());
      on('btn-sound',  () => this.toggleSound());

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'run') this.pause();
      });
    },

    toggleSound() {
      Sound.init();
      const on = Sound.toggle();
      this.el.btnSound.classList.toggle('muted', !on);
      this.el.btnSound.textContent = on ? '♪' : '✕';
    },

    // ============================================================
    //  Entrada
    // ============================================================
    bindInput() {
      const KEYS_L = ['ArrowLeft', 'KeyA'];
      const KEYS_R = ['ArrowRight', 'KeyD'];
      const KEYS_U = ['ArrowUp', 'KeyW', 'Space'];
      const KEYS_D = ['ArrowDown', 'KeyS'];

      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const c = e.code;
        if ([...KEYS_L, ...KEYS_R, ...KEYS_U, ...KEYS_D].includes(c)) e.preventDefault();

        const inShop = !Shop.el.screen.classList.contains('hidden');
        if (inShop) { if (c === 'Escape') Shop.close(); return; }

        if (this.state === 'menu' || this.state === 'over') {
          if (KEYS_U.includes(c) || c === 'Enter') this.start();
          return;
        }
        if (c === 'KeyP' || c === 'Escape') { this.togglePause(); return; }
        if (c === 'KeyM') { this.toggleSound(); return; }
        if (this.state !== 'run') return;

        if (KEYS_L.includes(c)) this.move(-1);
        else if (KEYS_R.includes(c)) this.move(1);
        else if (KEYS_U.includes(c)) this.jump();
        else if (KEYS_D.includes(c)) this.slide();
      }, { passive: false });

      // ---- gestos táctiles / ratón ----
      const cv = R.canvas;
      let sx = 0, sy = 0, st = 0, active = false;

      const down = (x, y) => { sx = x; sy = y; st = performance.now(); active = true; };
      const up = (x, y) => {
        if (!active) return;
        active = false;
        const dx = x - sx, dy = y - sy;
        const adx = Math.abs(dx), ady = Math.abs(dy);

        if (!Shop.el.screen.classList.contains('hidden')) return;
        if (this.state === 'menu' || this.state === 'over') { this.start(); return; }
        if (this.state !== 'run') return;

        if (adx < 26 && ady < 26 && performance.now() - st < 320) { this.jump(); return; }
        if (adx > ady) this.move(dx > 0 ? 1 : -1);
        else if (dy < 0) this.jump();
        else this.slide();
      };

      cv.addEventListener('pointerdown', (e) => { down(e.clientX, e.clientY); });
      cv.addEventListener('pointerup',   (e) => { up(e.clientX, e.clientY); });
      cv.addEventListener('pointercancel', () => { active = false; });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    move(dir) {
      const p = this.player;
      const n = U.clamp(p.lane + dir, 0, 2);
      if (n === p.lane) return;
      p.lane = n;
      Sound.lane();
    },

    /** Impulso de salto, con el perk del personaje y las súper zapatillas. */
    jumpVel() {
      const p = this.player;
      return this.JUMP_V * Store.perk('jump') * (p.boots > 0 ? this.BOOTS_MUL : 1);
    },

    jump() {
      const p = this.player;
      if (p.jet > 0) return;                    // volando no se salta
      if (p.y > p.support + 0.06) return;       // solo desde el suelo o un tren
      p.vy = this.jumpVel();
      p.sliding = false;
      p.slideT = 0;
      Sound.jump();
      this.burst(p.x, p.support, p.z, p.boots > 0 ? 14 : 8,
                 p.boots > 0 ? '#ff5ac8' : '#cfd8ea', 0.05);
    },

    slide() {
      const p = this.player;
      if (p.jet > 0 || p.sliding) return;
      p.sliding = true;
      p.slideT = this.SLIDE_TIME;
      if (p.y > p.support + 0.06) p.vy = -this.JUMP_V * 0.75;   // caída rápida
      Sound.slide();
      this.burst(p.x, p.support, p.z, 10, '#9fb0cc', 0.05);
    },

    // ============================================================
    //  Ciclo de partida
    // ============================================================
    resetRun() {
      this.obstacles.length = 0;
      this.coins.length = 0;
      this.pickups.length = 0;
      this.particles.length = 0;
      World.reset();

      this.speed = this.SPEED0;
      this.dist = 0;
      this.score = 0;
      this.coinCount = 0;
      this.coinStreak = 0;
      this.chunkCount = 0;
      this.lastPowerChunk = 0;
      this.dyingT = 0;
      this.newRecord = false;
      this.caught = false;
      this.chase = 0;
      this.guardSide = 1;
      this.spawnZ = 55;
      R.cam.x = 0;
      R.cam.y = 3.4;
      R.shake = 0;

      this.player = {
        lane: 1, x: 0, y: 0, z: 0, vy: 0,
        support: 0, sliding: false, slideT: 0,
        runPhase: 0, auraPhase: 0,
        magnet: 0, shield: 0, boost: 0, jet: 0, boots: 0,
        max: { magnet: 1, shield: 1, boost: 1, jet: 1, boots: 1 },
        invuln: 0, tilt: 0,
      };

      this.guard = { x: 0, y: 0, z: -3, support: 0, sliding: false, runPhase: 0 };

      this.fillWorld();
    },

    fillWorld() {
      let guard = 0;
      while (this.spawnZ < this.SPAWN_AHEAD && guard++ < 40) {
        this.spawnZ += World.spawnChunk(this);
      }
    },

    start() {
      Sound.init();
      this.resetRun();
      this.chase = 1;                       // arranque: el guardia viene pisando los talones
      this.guardSide = U.chance(0.5) ? 1 : -1;
      this.state = 'run';
      this.el.start.classList.add('hidden');
      this.el.over.classList.add('hidden');
      this.el.pause.classList.add('hidden');
      Shop.el.screen.classList.add('hidden');
      this.el.hud.classList.remove('hidden');
      Sound.whistle();
      if (Sound.enabled) Sound.startMusic();
    },

    toMenu() {
      this.state = 'menu';
      this.resetRun();
      this.el.over.classList.add('hidden');
      this.el.pause.classList.add('hidden');
      Shop.el.screen.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.start.classList.remove('hidden');
      this.refreshMenuStats();
      Sound.stopMusic();
    },

    togglePause() {
      if (this.state === 'run') this.pause();
      else if (this.state === 'pause') this.resume();
    },

    pause() {
      if (this.state !== 'run') return;
      this.state = 'pause';
      this.el.pause.classList.remove('hidden');
      Sound.stopMusic();
    },

    resume() {
      if (this.state !== 'pause') return;
      this.state = 'run';
      this.el.pause.classList.add('hidden');
      this.last = performance.now();
      if (Sound.enabled) Sound.startMusic();
    },

    /** reason: 'crash' (chocaste) | 'caught' (te pilló el guardia) */
    die(reason) {
      this.state = 'dying';
      this.dyingT = 0;
      this.caught = reason === 'caught';
      this.chase = 1;                       // el guardia entra en cuadro
      R.shake = 1;
      Sound.crash();
      if (this.caught) Sound.whistle();
      Sound.stopMusic();
      this.el.flash.classList.remove('on');
      void this.el.flash.offsetWidth;       // reinicia la animación
      this.el.flash.classList.add('on');
      this.burst(this.player.x, this.player.y + 0.7, this.player.z, 40, '#ff5a5f', 0.09, 2.4);
      this.burst(this.player.x, this.player.y + 0.9, this.player.z, 24, '#ffcf3d', 0.07, 2.0);
    },

    gameOver() {
      this.state = 'over';
      window.Hall && Hall.registrar('02-game', Math.round(this.score), { unidad: 'pts' });

      const earned = this.coinCount;
      Store.addCoins(earned);
      this.newRecord = Store.setBest(this.score);
      this.best = Store.data.best;

      this.el.oTitle.textContent = this.caught ? '¡TE ATRAPARON!' : 'ATROPELLADO';
      this.el.oScore.textContent = U.fmt(this.score);
      this.el.oDist.textContent = U.fmt(this.dist) + ' m';
      this.el.oCoins.textContent = U.fmt(this.coinCount);
      this.el.oBest.textContent = U.fmt(this.best);
      this.el.oEarned.textContent = U.fmt(earned);
      this.el.oBank.textContent = U.fmt(Store.data.bank);
      this.el.record.classList.toggle('hidden', !this.newRecord);
      this.el.warn.classList.add('hidden');
      this.el.over.classList.remove('hidden');
    },

    // ============================================================
    //  Bucle
    // ============================================================
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000) || 0;
      this.last = now;
      this.t += dt;

      if (this.state === 'run') this.update(dt);
      else if (this.state === 'dying') this.updateDying(dt);
      else if (this.state === 'menu') this.updateMenu(dt);

      this.render(dt);
      requestAnimationFrame((t) => this.loop(t));
    },

    /** El menú deja el mundo corriendo de fondo, sin jugador. */
    updateMenu(dt) {
      this.speed = 18;
      this.advanceWorld(dt);
      this.player.runPhase += dt * 9;
    },

    updateDying(dt) {
      this.dyingT += dt;
      this.speed = U.damp(this.speed, 0, 5, dt);
      this.advanceWorld(dt);
      this.player.y = Math.max(0, this.player.y - dt * 2);
      this.player.tilt = Math.min(1, this.player.tilt + dt * 3);
      this.updateGuard(dt, true);
      R.shake = U.damp(R.shake, 0, 4, dt);
      if (this.dyingT > 0.95) this.gameOver();
    },

    /** Desplaza el mundo hacia el jugador y recicla lo que queda atrás. */
    advanceWorld(dt) {
      const dz = this.speed * dt;
      this.dist += dz;
      this.spawnZ -= dz;

      for (const o of this.obstacles) o.z -= dz;
      for (const c of this.coins) c.z -= dz;
      for (const p of this.pickups) p.z -= dz;
      for (const p of this.particles) p.z -= dz;

      const cut = R.NEAR - 1;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const o = this.obstacles[i];
        if (o.dead || o.z + o.d / 2 < cut) this.obstacles.splice(i, 1);
      }
      for (let i = this.coins.length - 1; i >= 0; i--) {
        if (this.coins[i].dead || this.coins[i].z < cut) this.coins.splice(i, 1);
      }
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        if (this.pickups[i].dead || this.pickups[i].z < cut) this.pickups.splice(i, 1);
      }

      this.updateParticles(dt);
      this.fillWorld();
    },

    update(dt) {
      const p = this.player;

      this.speed = Math.min(this.SPEED_MAX, this.speed + this.ACCEL * dt);
      this.advanceWorld(dt);

      // ---- movimiento lateral ----
      p.x = U.damp(p.x, World.LANES[p.lane], 13, dt);
      p.tilt = U.damp(p.tilt, (World.LANES[p.lane] - p.x) * 0.9, 10, dt);

      // ---- deslizamiento ----
      if (p.sliding) {
        p.slideT -= dt;
        if (p.slideT <= 0) p.sliding = false;
      }

      // ---- vuelo / gravedad ----
      if (p.jet > 0) {
        p.sliding = false;
        p.support = 0;
        p.y = U.damp(p.y, this.JET_H, 6, dt);
        p.vy = 0;
        if (U.chance(0.75)) {
          this.burst(p.x + U.rand(-0.25, 0.25), p.y - 0.15, p.z, 1, '#ff9b3d', 0.05, 0.4);
        }
      } else {
        p.support = this.supportHeight(p);
        p.vy -= this.GRAVITY * dt;
        p.y += p.vy * dt;

        if (p.y <= p.support) {
          if (p.vy < -6) { Sound.land(); this.burst(p.x, p.support, p.z, 6, '#b9c6dd', 0.045); }
          p.y = p.support;
          p.vy = 0;
        }
        if (p.y < 0) { p.y = 0; p.vy = 0; }
      }

      const grounded = p.y <= p.support + 0.05;
      p.runPhase += dt * (grounded && p.jet <= 0 ? 7 + this.speed * 0.24 : 4);
      p.auraPhase += dt;

      // ---- potenciadores ----
      for (const k of this.POWERS) if (p[k] > 0) p[k] = Math.max(0, p[k] - dt);
      if (p.invuln > 0) p.invuln -= dt;

      // ---- recogidas y choques ----
      this.collectCoins(dt);
      this.collectPickups();
      this.checkCrash();
      if (this.state !== 'run') return;      // el choque pudo terminar la partida

      // ---- guardia ----
      this.updateGuard(dt, false);

      // ---- puntuación ----
      const mult = p.boost > 0 ? 2 : 1;
      this.score += this.speed * dt * 0.75 * mult * Store.perk('score');

      // ---- cámara ----
      R.cam.x = U.damp(R.cam.x, p.x * 0.38, 8, dt);
      R.cam.y = U.damp(R.cam.y, 3.4 + p.y * 0.45 + (p.sliding ? -0.25 : 0), 6, dt);
      R.shake = U.damp(R.shake, 0, 6, dt);

      this.updateHUD(mult);
    },

    // ------------------------ guardia -------------------------

    /**
     * El guardia entra por un lado y se va acercando al centro según `chase`.
     * Se mantiene siempre a una distancia acotada de la cámara para no tapar
     * la pista; la tensión se transmite con la posición lateral y el aviso.
     */
    updateGuard(dt, dying) {
      if (!dying) this.chase = U.clamp(this.chase - this.CHASE_DECAY * dt, 0, 1);

      const g = this.guard;
      const p = this.player;
      const k = this.chase;

      g.z = U.damp(g.z, U.lerp(-3.2, -1.5, k), 5, dt);
      g.x = U.damp(g.x, p.x + this.guardSide * U.lerp(2.6, 1.15, k), 4, dt);
      g.runPhase += dt * (8 + this.speed * 0.26);
      g.visible = k > 0.18;

      this.el.warn.classList.toggle('hidden', !(k > 0.5 && this.state === 'run'));
    },

    /** Sube la presión del guardia; si ya estaba encima, te atrapa. */
    stumble() {
      if (this.chase > this.CHASE_FATAL) { this.die('caught'); return true; }
      this.chase = 0.95;
      this.guardSide = this.player.x <= 0 ? 1 : -1;
      Sound.whistle();
      return false;
    },

    // ------------------------ física --------------------------

    /** Altura del suelo bajo el jugador (0, o el techo de un tren). */
    supportHeight(p) {
      let best = 0, bestObj = null;
      const x1 = p.x - this.P_HALF_W, x2 = p.x + this.P_HALF_W;
      const z1 = p.z - this.P_HALF_D, z2 = p.z + this.P_HALF_D;

      for (const o of this.obstacles) {
        o._carry = false;
        if (!o.ride) continue;
        const top = o.y + o.h;
        if (top <= best) continue;
        if (!U.overlap(x1, x2, o.x - o.w / 2, o.x + o.w / 2)) continue;
        if (!U.overlap(z1, z2, o.z - o.d / 2, o.z + o.d / 2)) continue;
        // Solo cuenta como suelo si el jugador llega por encima.
        if (p.y >= top - 0.35 || (p.y >= top - 0.6 && p.vy <= 0)) { best = top; bestObj = o; }
      }
      if (bestObj) bestObj._carry = true;   // se dibuja antes que el jugador
      return best;
    },

    checkCrash() {
      const p = this.player;
      if (p.invuln > 0) return;

      const x1 = p.x - this.P_HALF_W, x2 = p.x + this.P_HALF_W;
      const z1 = p.z - this.P_HALF_D, z2 = p.z + this.P_HALF_D;
      const h = p.sliding ? this.H_SLIDE : this.H_STAND;
      const y1 = p.y, y2 = p.y + h;

      for (const o of this.obstacles) {
        if (o.dead) continue;
        if (!U.overlap(x1, x2, o.x - o.w / 2, o.x + o.w / 2)) continue;
        if (!U.overlap(z1, z2, o.z - o.d / 2, o.z + o.d / 2)) continue;

        const oTop = o.y + o.h;
        if (o.ride && y1 >= oTop - 0.16) continue;            // va montado encima
        if (!(y1 < oTop - 0.12 && y2 > o.y + 0.06)) continue; // pasa por encima/debajo

        if (p.shield > 0) {
          p.shield = 0;
          o.dead = true;
          R.shake = 0.55;
          Sound.shieldHit();
          this.burst(o.x, o.y + o.h * 0.5, o.z, 26, '#4bd8ff', 0.07, 1.8);
          if (this.stumble()) return;                        // el guardia estaba encima
          p.invuln = 1.3;
        } else {
          this.die(this.chase > this.CHASE_FATAL ? 'caught' : 'crash');
        }
        return;
      }
    },

    collectCoins(dt) {
      const p = this.player;
      const magnet = p.magnet > 0 || p.jet > 0;       // el jetpack también recoge
      let got = 0;

      for (const c of this.coins) {
        if (c.dead) continue;
        c.phase += dt * 5;

        if (magnet && c.z > -1 && c.z < 17 && Math.abs(c.x - p.x) < 4.5) {
          const k = 1 - Math.exp(-6 * dt);
          c.x = U.lerp(c.x, p.x, k);
          c.y = U.lerp(c.y, p.y + 0.75, k);
          c.z = U.lerp(c.z, p.z, k * 0.55);
        }

        if (Math.abs(c.x - p.x) > 0.8) continue;
        if (Math.abs(c.z - p.z) > 0.85) continue;
        const h = p.sliding ? this.H_SLIDE : this.H_STAND;
        if (c.y < p.y - 0.45 || c.y > p.y + h + 0.45) continue;

        c.dead = true;
        got++;
        this.coinCount++;
        this.coinStreak++;
        this.score += 10 * (p.boost > 0 ? 2 : 1) * Store.perk('score');
        this.burst(c.x, c.y, c.z, 5, '#ffe27a', 0.035, 1.2);
      }
      if (got) {
        Sound.coin(this.coinStreak);
        this.el.coins.classList.remove('pop');
        void this.el.coins.offsetWidth;
        this.el.coins.classList.add('pop');
      }
    },

    collectPickups() {
      const p = this.player;
      for (const pk of this.pickups) {
        if (pk.dead) continue;
        pk.phase += 0.05;
        if (Math.abs(pk.x - p.x) > 1.0) continue;
        if (Math.abs(pk.z - p.z) > 1.0) continue;
        if (pk.y < p.y - 0.8 || pk.y > p.y + 2.2) continue;

        pk.dead = true;
        const dur = Store.duration(pk.type);
        p[pk.type] = dur;
        p.max[pk.type] = dur;
        if (pk.type === 'jet') p.invuln = Math.max(p.invuln, 0.7);   // subida limpia
        Sound.power();
        this.burst(pk.x, pk.y, pk.z, 22, U.rgb(pk.color), 0.06, 1.6);
      }
    },

    // ---------------------- partículas ------------------------

    burst(x, y, z, n, color, size, spread = 1) {
      for (let i = 0; i < n; i++) {
        if (this.particles.length > 320) break;
        this.particles.push({
          x, y, z,
          vx: U.rand(-2.2, 2.2) * spread,
          vy: U.rand(0.4, 5.5) * spread,
          vz: U.rand(-2.5, 3.5) * spread,
          life: U.rand(0.3, 0.8), max: 0.8,
          size: size * U.rand(0.7, 1.4),
          color,
        });
      }
    },

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.vy -= 14 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.y < 0) { p.y = 0; p.vy *= -0.35; p.vx *= 0.7; p.vz *= 0.7; }
      }
    },

    // -------------------------- HUD ---------------------------

    updateHUD(mult) {
      this.el.score.textContent = U.fmt(this.score);
      this.el.dist.textContent = U.fmt(this.dist) + ' m';
      this.el.coins.textContent = U.fmt(this.coinCount);
      this.el.mult.classList.toggle('hidden', mult <= 1);

      const p = this.player;
      for (const k of this.POWERS) {
        const ui = this.powerEls[k];
        const left = p[k];
        const on = left > 0;
        ui.root.classList.toggle('hidden', !on);
        if (on) {
          ui.bar.style.width = (left / (p.max[k] || 1) * 100) + '%';
          ui.root.classList.toggle('expiring', left < 2.5);
        }
      }
    },

    // ------------------------ dibujado ------------------------

    render(dt) {
      const c = R.ctx;
      c.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);

      if (R.shake > 0.002) {
        c.translate(U.rand(-1, 1) * R.shake * 14, U.rand(-1, 1) * R.shake * 10);
      }

      R.drawSky(this.dist);
      R.drawGround(this.dist);
      R.drawScenery(this.dist);

      // Orden del pintor: de lejos a cerca. Para las cajas manda su cara
      // frontal (z - profundidad/2); el tren que lleva al jugador se fuerza
      // delante de la cola para que no lo tape.
      const list = this.drawList;
      list.length = 0;
      for (const o of this.obstacles) { o._k = o._carry ? 0.001 : o.z - o.d / 2; list.push(o); }
      for (const o of this.coins)   if (!o.dead) { o._k = o.z; list.push(o); }
      for (const o of this.pickups) if (!o.dead) { o._k = o.z; list.push(o); }

      const showPlayer = this.state !== 'menu';
      const showGuard = showPlayer && this.guard.visible;
      if (showGuard) { this.guard._k = this.guard.z; this.guard._guard = true; list.push(this.guard); }

      list.sort((a, b) => b._k - a._k);

      let playerDrawn = !showPlayer;
      for (const it of list) {
        if (!playerDrawn && it._k < this.player.z) { this.drawPlayer(); playerDrawn = true; }
        if (it._guard) R.drawGuard(it);
        else if (it.kind) R.drawObstacle(it);
        else if (it.type) R.drawPickup(it);
        else R.drawCoin(it);
      }
      if (!playerDrawn) this.drawPlayer();

      R.drawParticles(this.particles);
      R.drawSpeedLines(U.clamp((this.speed - 30) / 18, 0, 1), this.t);
      R.drawVignette(this.tint());
    },

    /** Tinte de pantalla: rojo al morir, ámbar cuando el guardia aprieta. */
    tint() {
      if (this.state === 'dying') return 'rgba(120,0,10,.18)';
      if (this.state === 'run' && this.chase > 0.5) {
        return `rgba(150,20,30,${((this.chase - 0.5) * 0.26).toFixed(3)})`;
      }
      return null;
    },

    drawPlayer() {
      const p = this.player;
      if (p.invuln > 0 && Math.floor(this.t * 14) % 2 === 0) return;   // parpadeo
      R.drawPlayer(p);
    },
  };

  window.addEventListener('load', () => Game.init());
}

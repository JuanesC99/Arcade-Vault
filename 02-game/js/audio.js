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

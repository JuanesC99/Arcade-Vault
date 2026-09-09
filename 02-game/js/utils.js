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

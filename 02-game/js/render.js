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

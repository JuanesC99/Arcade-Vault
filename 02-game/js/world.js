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

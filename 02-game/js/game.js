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

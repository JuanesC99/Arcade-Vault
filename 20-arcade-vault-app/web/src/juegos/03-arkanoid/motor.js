/**
 * Motor de la cabina 03-arkanoid.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { acciones: [{ k:'p', txt:'PAUSA' }], arrastre: true };

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

  /* ---------- assets/spritesheet.js ---------- */
  const EXPLOSION_FRAMES = {
    red: [ { sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 } ],
    cyan: [ { sx: 256, sy: 192, sw: 32, sh: 16 }, { sx: 288, sy: 192, sw: 32, sh: 16 }, { sx: 320, sy: 192, sw: 32, sh: 16 }, { sx: 352, sy: 192, sw: 32, sh: 16 } ],
    green: [ { sx: 256, sy: 208, sw: 32, sh: 16 }, { sx: 288, sy: 208, sw: 32, sh: 16 }, { sx: 320, sy: 208, sw: 32, sh: 16 }, { sx: 352, sy: 208, sw: 32, sh: 16 } ],
    magenta: [ { sx: 256, sy: 224, sw: 32, sh: 16 }, { sx: 288, sy: 224, sw: 32, sh: 16 }, { sx: 320, sy: 224, sw: 32, sh: 16 }, { sx: 352, sy: 224, sw: 32, sh: 16 } ],
    yellow: [ { sx: 256, sy: 240, sw: 32, sh: 16 }, { sx: 288, sy: 240, sw: 32, sh: 16 }, { sx: 320, sy: 240, sw: 32, sh: 16 }, { sx: 352, sy: 240, sw: 32, sh: 16 } ],
    hotpink: [ { sx: 256, sy: 256, sw: 32, sh: 16 }, { sx: 288, sy: 256, sw: 32, sh: 16 }, { sx: 320, sy: 256, sw: 32, sh: 16 }, { sx: 352, sy: 256, sw: 32, sh: 16 } ],
    gray: [ { sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 } ],
  };

  const EXPLOSION_DURATION = 150;

  const SPRITES = {
    paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
    ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
    blocks: {
      gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
      red: { sx: 32, sy: 176, sw: 32, sh: 16 },
      yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
      cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
      magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
      hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
      green: { sx: 32, sy: 208, sw: 32, sh: 16 },
    }
  };

  let ssImg = null;
  let ssLoaded = false;
  const ssCallbacks = [];

  function loadSpritesheet( cb ) {
    if ( ssLoaded ) { cb(); return; }
    ssCallbacks.push( cb );
    if ( ssImg ) return;

    const rawImg = new Image();
    rawImg.onload = () => {
      const oc = document.createElement( 'canvas' );
      oc.width = rawImg.width;
      oc.height = rawImg.height;
      const octx = oc.getContext( '2d' );
      octx.drawImage( rawImg, 0, 0 );
      ssImg = oc;
      ssLoaded = true;
      ssCallbacks.forEach( f => f() );
    };
    rawImg.onerror = () => console.error( 'Failed to load spritesheet' );
    rawImg.src = '/juegos/03-arkanoid/assets/spritesheet-breakout.png';
  }

  function drawFrame( ctx, frame, x, y, w, h ) {
    if ( !ssLoaded ) return;
    ctx.drawImage( ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h );
  }

  function drawSprite( ctx, name, x, y, w, h ) {
    if ( !ssLoaded ) return;
    let sp;
    if ( name.startsWith( 'block_' ) ) {
      sp = SPRITES.blocks[ name.slice( 6 ) ];
    } else {
      sp = SPRITES[ name ];
    }
    if ( !sp ) return;
    ctx.drawImage( ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h );
  }

  /* ---------- levels.js ---------- */
  const LEVELS = (() => {
    const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
    const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green'];
    const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red'];

    const l1 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        l1.push({ col, row, color: rowColors1[row] });

    const l2 = [];
    const pyStart = [4, 3, 2, 1, 0, 0];
    const pyEnd   = [5, 6, 7, 8, 9, 9];
    for (let row = 0; row < 6; row++)
      for (let col = pyStart[row]; col <= pyEnd[row]; col++)
        l2.push({ col, row, color: rowColors2[row] });

    const l3 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if ((col + row) % 2 === 0)
          l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' });

    const gaps4 = [
      [2, 5, 8], [0, 4, 7, 9], [1, 3, 6],
      [2, 5, 8, 9], [0, 4, 7], [1, 3, 6, 9],
    ];
    const l4 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if (!gaps4[row].includes(col))
          l4.push({ col, row, color: rowColors4[row] });

    const l5 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++) {
        const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
        const isCross = col === 4 || row === 2;
        if (isFrame || isCross)
          l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' });
      }

    const rowColors6  = ['magenta', 'red', 'yellow', 'yellow', 'red', 'magenta'];
    const rowColors7  = ['green', 'cyan', 'hotpink', 'green', 'cyan', 'hotpink'];
    const rowColors8  = ['red', 'gray', 'red', 'gray', 'red', 'gray'];
    const rowColors9  = ['cyan', 'green', 'yellow', 'hotpink', 'red', 'magenta'];

    // Nivel 6 — rombo centrado
    const diamondHalf = [1, 2, 3, 3, 2, 1];
    const l6 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if (Math.abs(col - 4.5) <= diamondHalf[row])
          l6.push({ col, row, color: rowColors6[row], hits: (row === 2 || row === 3) ? 2 : 1 });

    // Nivel 7 — tablero de cuadros 2x2
    const l7 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if ((Math.floor(col / 2) + Math.floor(row / 2)) % 2 === 0)
          l7.push({ col, row, color: rowColors7[row], hits: row <= 1 ? 2 : 1 });

    // Nivel 8 — dos torres laterales unidas por la fila superior
    const l8 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if (col <= 2 || col >= 7 || row === 0)
          l8.push({ col, row, color: rowColors8[row], hits: row === 0 ? 3 : 2 });

    // Nivel 9 — pirámide invertida
    const l9 = [];
    for (let row = 0; row < 5; row++)
      for (let col = row; col <= 9 - row; col++)
        l9.push({ col, row, color: rowColors9[row], hits: row === 4 ? 3 : (row === 0 ? 2 : 1) });

    // Nivel 10 — marco con aspa
    const l10 = [];
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++) {
        const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
        const diag = Math.round(row * 9 / 5);
        const isX = col === diag || col === 9 - diag;
        if (isFrame || isX)
          l10.push({ col, row, color: isX && !isFrame ? 'red' : 'gray', hits: isFrame ? 2 : 3 });
      }

    return [
      { speed: 1.00, blocks: l1 },
      { speed: 1.10, blocks: l2 },
      { speed: 1.21, blocks: l3 },
      { speed: 1.33, blocks: l4 },
      { speed: 1.46, blocks: l5 },
      { speed: 1.61, blocks: l6 },
      { speed: 1.77, blocks: l7 },
      { speed: 1.95, blocks: l8 },
      { speed: 2.14, blocks: l9 },
      { speed: 2.36, blocks: l10 },
    ];
  })();

  /* ---------- game.js ---------- */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const PADDLE_SPEED = 400;
  const BLOCK_COLS = 10;
  const BLOCK_ROWS = 6;
  const BLOCK_W = 64;
  const BLOCK_H = 24;
  const BLOCK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
  const BLOCKS_ORIGIN_X = (800 - BLOCK_COLS * BLOCK_W) / 2;
  const BLOCKS_ORIGIN_Y = 80;
  const BASE_BALL_VX = 200;
  const BASE_BALL_VY = -300;

  const POWERUP_DROP_CHANCE = 0.15;
  const POWERUP_FALL_SPEED = 120;
  const POWERUP_W = 24;
  const POWERUP_H = 12;
  const MULTIBALL_SPLIT = 3;
  const MAX_BALLS = 8;

  const MAX_CONTINUES = 3;
  const CONTINUE_SECONDS = 10;

  const CRACK_COLOR = 'rgba(0, 0, 0, 0.75)';
  const CRACK_COLOR_DARK_BLOCK = 'rgba(255, 255, 255, 0.7)';
  const CRACK_WIDTH = 2;

  const POWERUP_TYPES = {
    multiball: { color: '#40e0e0', letter: 'M' },
    extralife: { color: '#40e040', letter: 'V' },
  };

  const paddle = { x: 0, y: 560, w: 81, h: 14 };

  const bounceSound   = new Audio('/juegos/03-arkanoid/assets/sounds/ball-bounce.mp3');
  const breakSound    = new Audio('/juegos/03-arkanoid/assets/sounds/break-sound.mp3');
  const powerupSound  = new Audio('/juegos/03-arkanoid/assets/sounds/powerup.mp3');
  const lifeLostSound = new Audio('/juegos/03-arkanoid/assets/sounds/life-lost.mp3');
  const levelUpSound  = new Audio('/juegos/03-arkanoid/assets/sounds/level-complete.mp3');

  // Volumen de los efectos, 0 a 1. Un único punto de ajuste para todos.
  const SFX_VOLUME = 0.3;

  // Chrome rechaza play() hasta que el usuario interactúa con la página.
  // Ignoramos ese rechazo para no ensuciar la consola.
  // cloneNode no copia la propiedad volume, hay que fijarla en cada clon.
  function playSound(audio) {
    const clip = audio.cloneNode();
    clip.volume = SFX_VOLUME;
    const p = clip.play();
    if (p) p.catch(() => {});
  }

  let balls = [];
  let powerups = [];
  let blocks = [];
  let explosions = [];
  let lives = 3;
  let score = 0;
  let gameState = 'playing';
  let currentLevel = 1;
  let isPaused = false;
  let continuesLeft = MAX_CONTINUES;
  let continueTimer = 0;

  const keys = { ArrowLeft: false, ArrowRight: false };

  // ---- panel del salón ----
  // Los mismos recuadros que las demás cabinas: el marcador vive en el panel,
  // no dentro del lienzo.
  const el = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    level: document.getElementById('level'),
    lives: document.getElementById('lives'),
    continues: document.getElementById('continues'),
  };

  let best = 0;
  const ultimoHud = {};

  // El bucle llama a pintarHud en cada cuadro, pero solo se escribe en el DOM
  // cuando el número cambió, para no mover el layout sesenta veces por segundo.
  function ponerHud(nombre, valor) {
    if (!el[nombre] || ultimoHud[nombre] === valor) return;
    ultimoHud[nombre] = valor;
    el[nombre].textContent = valor;
  }

  function pintarHud() {
    if (score > best) best = score;
    ponerHud('score', score);
    ponerHud('best', best);
    ponerHud('level', currentLevel + '/' + LEVELS.length);
    ponerHud('lives', lives);
    ponerHud('continues', continuesLeft);
  }

  function initPaddle() {
    paddle.x = (canvas.width - paddle.w) / 2;
  }

  function makeBall(speed) {
    return {
      x: paddle.x + (paddle.w - 16) / 2,
      y: paddle.y - 16,
      w: 16,
      h: 16,
      vx: BASE_BALL_VX * speed,
      vy: BASE_BALL_VY * speed,
    };
  }

  function initBall() {
    balls = [makeBall(LEVELS[currentLevel - 1].speed)];
  }

  function restartGame() {
    score = 0;
    lives = 3;
    continueTimer = 0;
    gameState = 'playing';
    isPaused = false;
    loadLevel(1);
  }

  function loadLevel(n) {
    currentLevel = n;
    const level = LEVELS[n - 1];
    blocks = level.blocks.map(b => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      hits: b.hits || 1,
      maxHits: b.hits || 1,
      alive: true,
    }));
    explosions = [];
    powerups = [];
    balls = [makeBall(level.speed)];
  }

  function collideAABB(ball, box) {
    return (
      ball.x < box.x + box.w &&
      ball.x + ball.w > box.x &&
      ball.y < box.y + box.h &&
      ball.y + ball.h > box.y
    );
  }

  function spawnPowerup(block) {
    const type = Math.random() < 0.5 ? 'multiball' : 'extralife';
    powerups.push({
      x: block.x + (block.w - POWERUP_W) / 2,
      y: block.y + (block.h - POWERUP_H) / 2,
      w: POWERUP_W,
      h: POWERUP_H,
      vy: POWERUP_FALL_SPEED,
      type,
    });
  }

  function splitBall() {
    if (balls.length === 0) return;
    if (balls.length + (MULTIBALL_SPLIT - 1) > MAX_BALLS) return;

    const src = balls.shift();
    const speed = Math.hypot(src.vx, src.vy);
    const angle = Math.atan2(src.vy, src.vx);
    const spread = [-20, 0, 20];

    for (const deg of spread) {
      const a = angle + (deg * Math.PI) / 180;
      balls.push({
        x: src.x,
        y: src.y,
        w: src.w,
        h: src.h,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
      });
    }
  }

  function applyPowerup(type) {
    if (type === 'extralife') lives++;
    if (type === 'multiball') splitBall();
    playSound(powerupSound);
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (gameState === 'continue') {
      if (hitRect(mx, my, CONTINUE_BTN)) {
        continuesLeft--;
        restartGame();
      }
      return;
    }

    if (gameState === 'gameover') {
      if (hitRect(mx, my, RESTART_BTN)) {
        continuesLeft = MAX_CONTINUES;
        restartGame();
      }
      return;
    }

    if (!isPaused) return;
    for (let i = 0; i < LEVELS.length; i++) {
      const b = pauseButtonRect(i);
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        loadLevel(i + 1);
        isPaused = false;
        return;
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, mouseX - paddle.w / 2));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') {
      isPaused = !isPaused;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  function update(dt) {
    if (gameState !== 'playing') return;

    // Paddle
    if (keys.ArrowLeft)  paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keys.ArrowRight) paddle.x = Math.min(canvas.width - paddle.w, paddle.x + PADDLE_SPEED * dt);

    let levelCleared = false;

    for (const ball of balls) {
      // Ball movement
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Wall bounces (left, right, top)
      if (ball.x <= 0) { ball.x = 0; ball.vx = Math.abs(ball.vx); playSound(bounceSound); }
      if (ball.x + ball.w >= canvas.width) { ball.x = canvas.width - ball.w; ball.vx = -Math.abs(ball.vx); playSound(bounceSound); }
      if (ball.y <= 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); playSound(bounceSound); }

      // Paddle bounce
      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h;
        ball.vy = -Math.abs(ball.vy);
        playSound(bounceSound);
      }

      // Block collisions
      for (const block of blocks) {
        if (!block.alive) continue;
        if (collideAABB(ball, block)) {
          block.hits--;
          score += 10;
          ball.vy = -ball.vy;
          if (block.hits <= 0) {
            block.alive = false;
            explosions.push({ x: block.x, y: block.y, w: block.w, h: block.h, color: block.color, elapsed: 0 });
            playSound(breakSound);
            if (Math.random() < POWERUP_DROP_CHANCE) spawnPowerup(block);
            if (blocks.every(b => !b.alive)) levelCleared = true;
          } else {
            // Golpe que agrieta pero no destruye
            playSound(bounceSound);
          }
          break; // one block per ball per frame
        }
      }
    }

    // Powerup capsules
    for (const p of powerups) p.y += p.vy * dt;
    powerups = powerups.filter(p => {
      if (collideAABB(p, paddle)) {
        applyPowerup(p.type);
        return false;
      }
      return p.y <= canvas.height;
    });

    // Explosions
    for (const exp of explosions) exp.elapsed += dt * 1000;
    explosions = explosions.filter(exp => exp.elapsed < EXPLOSION_DURATION);

    if (levelCleared) {
      playSound(levelUpSound);
      if (currentLevel < LEVELS.length) loadLevel(currentLevel + 1);
      else {
        gameState = 'win';
        window.Hall && Hall.registrar('03-arkanoid', score, { unidad: 'pts', etiqueta: 'completado' });
      }
      return;
    }

    // Lost balls
    balls = balls.filter(b => b.y <= canvas.height);
    if (balls.length === 0) {
      lives--;
      playSound(lifeLostSound);
      if (lives <= 0) window.Hall && Hall.registrar('03-arkanoid', score, { unidad: 'pts' });
      if (lives <= 0) {
        lives = 0;
        if (continuesLeft > 0) {
          gameState = 'continue';
          continueTimer = CONTINUE_SECONDS;
        } else {
          gameState = 'gameover';
        }
      } else {
        initBall();
      }
    }
  }

  function drawOverlay(message) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }

  const PAUSE_BTN_W = 60;
  const PAUSE_BTN_H = 40;
  const PAUSE_BTN_GAP = 12;
  const PAUSE_BTN_Y = 340;
  const PAUSE_BTN_PER_ROW = 5;
  const PAUSE_BTN_ROW_X = (canvas.width - (PAUSE_BTN_PER_ROW * PAUSE_BTN_W + (PAUSE_BTN_PER_ROW - 1) * PAUSE_BTN_GAP)) / 2;

  function pauseButtonRect(i) {
    const row = Math.floor(i / PAUSE_BTN_PER_ROW);
    const col = i % PAUSE_BTN_PER_ROW;
    return {
      x: PAUSE_BTN_ROW_X + col * (PAUSE_BTN_W + PAUSE_BTN_GAP),
      y: PAUSE_BTN_Y + row * (PAUSE_BTN_H + PAUSE_BTN_GAP),
      w: PAUSE_BTN_W,
      h: PAUSE_BTN_H,
    };
  }

  const CONTINUE_BTN = { x: (canvas.width - 140) / 2, y: 400, w: 140, h: 56 };
  const RESTART_BTN = { x: (canvas.width - 200) / 2, y: 380, w: 200, h: 52 };

  function hitRect(mx, my, r) {
    return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
  }

  function drawButton(r, label, fontSize) {
    ctx.fillStyle = '#f0c040';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold ' + fontSize + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  }

  function drawContinueOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, 170);

    ctx.font = 'bold 32px monospace';
    ctx.fillText('¿CONTINUAR?', canvas.width / 2, 240);

    ctx.fillStyle = '#f0c040';
    ctx.font = 'bold 96px monospace';
    ctx.fillText(Math.ceil(continueTimer), canvas.width / 2, 330);

    drawButton(CONTINUE_BTN, 'SÍ', 32);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Continues restantes: ' + continuesLeft, canvas.width / 2, 500);
  }

  function drawGameOverOverlay() {
    drawOverlay('GAME OVER');
    drawButton(RESTART_BTN, 'REINICIAR', 22);
  }

  function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSA', canvas.width / 2, 260);

    ctx.font = 'bold 16px monospace';
    ctx.fillText('Saltar al nivel:', canvas.width / 2, 310);

    for (let i = 0; i < LEVELS.length; i++) {
      const b = pauseButtonRect(i);
      const isActive = (i + 1) === currentLevel;
      ctx.fillStyle = isActive ? '#f0c040' : '#444';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isActive ? '#000' : '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, b.x + b.w / 2, b.y + b.h / 2);
    }
  }

  // PRNG determinista: la misma semilla da siempre el mismo trazo,
  // así la grieta de un bloque no parpadea entre frames.
  function crackRand(seed) {
    const v = Math.sin(seed) * 10000;
    return v - Math.floor(v);
  }

  function drawCracks(block) {
    const damage = block.maxHits - block.hits;
    if (damage <= 0) return;

    ctx.strokeStyle = block.color === 'gray' ? CRACK_COLOR_DARK_BLOCK : CRACK_COLOR;
    ctx.lineWidth = CRACK_WIDTH;
    ctx.lineCap = 'round';

    for (let i = 0; i < damage; i++) {
      const seed = block.x * 0.37 + block.y * 0.71 + i * 13.1;
      const x0 = block.x + block.w * (0.10 + 0.20 * crackRand(seed));
      const x1 = block.x + block.w * (0.40 + 0.20 * crackRand(seed + 1));
      const x2 = block.x + block.w * (0.70 + 0.20 * crackRand(seed + 2));
      const yMid = block.y + block.h * (0.35 + 0.30 * crackRand(seed + 3));
      ctx.beginPath();
      ctx.moveTo(x0, block.y + block.h * 0.15);
      ctx.lineTo(x1, yMid);
      ctx.lineTo(x2, block.y + block.h * 0.85);
      ctx.stroke();
    }
  }

  function drawPowerup(p) {
    const style = POWERUP_TYPES[p.type];
    ctx.fillStyle = style.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(style.letter, p.x + p.w / 2, p.y + p.h / 2 + 1);
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const block of blocks) {
      if (!block.alive) continue;
      drawSprite(ctx, 'block_' + block.color, block.x, block.y, block.w, block.h);
      drawCracks(block);
    }

    for (const exp of explosions) {
      const frameIndex = Math.min(Math.floor(exp.elapsed / EXPLOSION_DURATION * 4), 3);
      drawFrame(ctx, EXPLOSION_FRAMES[exp.color][frameIndex], exp.x, exp.y, exp.w, exp.h);
    }

    for (const p of powerups) drawPowerup(p);

    drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
    for (const ball of balls) drawSprite(ctx, 'ball', ball.x, ball.y, ball.w, ball.h);

    if (gameState === 'continue') drawContinueOverlay();
    if (gameState === 'gameover') drawGameOverOverlay();
    if (gameState === 'win')      drawOverlay('¡Completaste el juego!');
    if (isPaused)                 drawPauseOverlay();
  }

  let lastTime = null;

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (gameState === 'continue') {
      continueTimer -= dt;
      if (continueTimer <= 0) {
        continueTimer = 0;
        gameState = 'gameover';
      }
    }

    if (!isPaused) update(dt);
    draw();
    pintarHud();

    requestAnimationFrame(loop);
  }

  loadSpritesheet(() => {
    initPaddle();
    loadLevel(1);
    pintarHud();
    requestAnimationFrame(loop);
  });
}

/**
 * Motor de la cabina 14-asteroides.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { cruceta:'nave', acciones: [{ k:' ', txt:'FUEGO' }, { k:'p', txt:'PAUSA' }] };

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

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  const GIRO = 3.6;          // radianes por segundo
  const EMPUJE = 300;        // píxeles por segundo al cuadrado
  const ROCE = 0.55;         // pérdida de inercia por segundo
  const VEL_MAX = 380;
  const BALA_VEL = 520;
  const BALA_VIDA = 0.95;    // segundos
  const CADENCIA = 0.22;

  const TAMANOS = {
    3: { r: 42, puntos: 20 },
    2: { r: 24, puntos: 50 },
    1: { r: 13, puntos: 100 },
  };

  let nave, rocas, balas, restos, teclas = {};
  let score, wave, lives, estado, disparoCd, invulnerable;

  const el = {
    score: document.getElementById('score'),
    wave: document.getElementById('wave'),
    lives: document.getElementById('lives'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function envolver(o){
    if(o.x < 0) o.x += W;
    if(o.x > W) o.x -= W;
    if(o.y < 0) o.y += H;
    if(o.y > H) o.y -= H;
  }

  function crearRoca(x, y, t){
    const a = Math.random() * Math.PI * 2;
    const vel = 26 + Math.random() * 34 + (3 - t) * 16;
    // silueta irregular, fija por roca
    const puntas = 9 + Math.floor(Math.random() * 4);
    const forma = [];
    for(let i = 0; i < puntas; i++) forma.push(0.68 + Math.random() * 0.5);
    return {
      x, y, t,
      r: TAMANOS[t].r,
      vx: Math.cos(a) * vel,
      vy: Math.sin(a) * vel,
      giro: (Math.random() - 0.5) * 1.2,
      ang: Math.random() * Math.PI * 2,
      forma,
    };
  }

  function nuevaOleada(){
    rocas = [];
    const cuantas = 3 + wave;
    for(let i = 0; i < cuantas; i++){
      // nunca aparecen encima de la nave
      let x, y;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while(Math.hypot(x - W/2, y - H/2) < 170);
      rocas.push(crearRoca(x, y, 3));
    }
    balas = [];
  }

  function colocarNave(){
    nave = { x: W/2, y: H/2, vx: 0, vy: 0, ang: -Math.PI/2 };
    invulnerable = 2.2;
  }

  function arrancar(){
    score = 0; wave = 1; lives = 3;
    disparoCd = 0;
    restos = [];
    colocarNave();
    nuevaOleada();
    estado = 'jugando';
    el.over.classList.remove('show');
    pintarHud();
  }

  function pintarHud(){
    el.score.textContent = score;
    el.wave.textContent = wave;
    el.lives.textContent = lives;
  }

  function terminar(){
    estado = 'fin';
    window.Hall && Hall.registrar('14-asteroides', score, { unidad: 'pts', etiqueta: 'oleada ' + wave });
    el.overTitle.textContent = 'CHATARRA';
    el.overText.textContent = score + ' puntos · oleada ' + wave;
    el.overBtn.textContent = 'OTRA PARTIDA';
    el.over.classList.add('show');
  }

  function reventar(x, y, n, color){
    for(let i = 0; i < n; i++){
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 150;
      restos.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, t: 0, vida: 0.5 + Math.random()*0.4, color });
    }
  }

  function romperRoca(i){
    const r = rocas[i];
    score += TAMANOS[r.t].puntos;
    reventar(r.x, r.y, 10, '#8b83b4');
    rocas.splice(i, 1);
    if(r.t > 1){
      rocas.push(crearRoca(r.x, r.y, r.t - 1));
      rocas.push(crearRoca(r.x, r.y, r.t - 1));
    }
    pintarHud();
  }

  function perderNave(){
    lives--;
    reventar(nave.x, nave.y, 24, '#35f0d0');
    pintarHud();
    if(lives <= 0) return terminar();
    colocarNave();
  }

  function actualizar(dt){
    if(invulnerable > 0) invulnerable -= dt;

    if(teclas.arrowleft)  nave.ang -= GIRO * dt;
    if(teclas.arrowright) nave.ang += GIRO * dt;
    if(teclas.arrowup){
      nave.vx += Math.cos(nave.ang) * EMPUJE * dt;
      nave.vy += Math.sin(nave.ang) * EMPUJE * dt;
      if(Math.random() < 0.5)
        restos.push({
          x: nave.x - Math.cos(nave.ang)*14, y: nave.y - Math.sin(nave.ang)*14,
          vx: -Math.cos(nave.ang)*90 + (Math.random()-0.5)*40,
          vy: -Math.sin(nave.ang)*90 + (Math.random()-0.5)*40,
          t: 0, vida: 0.25, color: '#ffb020',
        });
    }

    const v = Math.hypot(nave.vx, nave.vy);
    if(v > VEL_MAX){ nave.vx *= VEL_MAX/v; nave.vy *= VEL_MAX/v; }
    const frena = Math.max(0, 1 - ROCE * dt);
    nave.vx *= frena; nave.vy *= frena;

    nave.x += nave.vx * dt; nave.y += nave.vy * dt;
    envolver(nave);

    disparoCd -= dt;
    if(teclas[' '] && disparoCd <= 0){
      balas.push({
        x: nave.x + Math.cos(nave.ang)*16,
        y: nave.y + Math.sin(nave.ang)*16,
        vx: nave.vx + Math.cos(nave.ang)*BALA_VEL,
        vy: nave.vy + Math.sin(nave.ang)*BALA_VEL,
        t: 0,
      });
      disparoCd = CADENCIA;
    }

    for(const b of balas){ b.x += b.vx*dt; b.y += b.vy*dt; b.t += dt; envolver(b); }
    balas = balas.filter(b => b.t < BALA_VIDA);

    for(const r of rocas){ r.x += r.vx*dt; r.y += r.vy*dt; r.ang += r.giro*dt; envolver(r); }

    for(const p of restos){ p.x += p.vx*dt; p.y += p.vy*dt; p.t += dt; }
    restos = restos.filter(p => p.t < p.vida);

    // balas contra rocas
    for(let i = rocas.length - 1; i >= 0; i--){
      for(let j = balas.length - 1; j >= 0; j--){
        if(Math.hypot(balas[j].x - rocas[i].x, balas[j].y - rocas[i].y) < rocas[i].r){
          balas.splice(j, 1);
          romperRoca(i);
          break;
        }
      }
    }

    // rocas contra la nave
    if(invulnerable <= 0){
      for(const r of rocas){
        if(Math.hypot(nave.x - r.x, nave.y - r.y) < r.r + 9){ perderNave(); return; }
      }
    }

    if(!rocas.length){
      wave++;
      score += 150;
      invulnerable = 1.6;
      nuevaOleada();
      pintarHud();
    }
  }

  function dibujarRoca(r){
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.ang);
    ctx.strokeStyle = '#c8c2e8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(46,42,74,.55)';
    ctx.beginPath();
    r.forma.forEach((f, i) => {
      const a = (i / r.forma.length) * Math.PI * 2;
      const px = Math.cos(a) * r.r * f, py = Math.sin(a) * r.r * f;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function dibujar(){
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(233,229,255,.20)';
    for(let i = 0; i < 70; i++) ctx.fillRect((i*163)%W, (i*97)%H, 2, 2);

    for(const p of restos){
      ctx.globalAlpha = 1 - p.t/p.vida;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-1.5, p.y-1.5, 3, 3);
    }
    ctx.globalAlpha = 1;

    for(const r of rocas) dibujarRoca(r);

    ctx.fillStyle = '#ffe9a8';
    for(const b of balas) ctx.fillRect(b.x-2, b.y-2, 4, 4);

    if(estado === 'jugando' || estado === 'pausa'){
      // parpadea mientras es invulnerable
      if(!(invulnerable > 0 && Math.floor(performance.now()/110) % 2)){
        ctx.save();
        ctx.translate(nave.x, nave.y);
        ctx.rotate(nave.ang);
        ctx.strokeStyle = '#35f0d0';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#35f0d0'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(16, 0); ctx.lineTo(-11, -10); ctx.lineTo(-6, 0); ctx.lineTo(-11, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  }

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    teclas[k] = true;
    if(['arrowleft','arrowright','arrowup',' '].includes(k)) e.preventDefault();
    if(k === 'p'){
      if(estado === 'jugando'){
        estado = 'pausa';
        el.overTitle.textContent = 'PAUSA';
        el.overText.textContent = 'Pulsa P para seguir';
        el.overBtn.textContent = 'REINICIAR';
        el.over.classList.add('show');
      } else if(estado === 'pausa'){
        estado = 'jugando';
        el.over.classList.remove('show');
      }
    }
  });
  document.addEventListener('keyup', e => { teclas[e.key.toLowerCase()] = false; });

  el.overBtn.addEventListener('click', arrancar);

  score = 0; wave = 1; lives = 3; disparoCd = 0; restos = [];
  colocarNave();
  nuevaOleada();
  estado = 'menu';
  pintarHud();

  let ultimo = performance.now();
  function bucle(t){
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    if(estado === 'jugando') actualizar(dt);
    dibujar();
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);
}

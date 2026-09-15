/**
 * Motor de la cabina 09-vuelo-rasante.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { acciones: [{ k:' ', txt:'IMPULSO' }, { k:'p', txt:'PAUSA' }], toque: true };

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

  const GRAVEDAD = 1500, IMPULSO = -430, SUELO = H - 40;
  const NAVE_R = 13;

  let nave, torres, score, best = 0, estado, velBase, hueco, desdeUltima, fondo = 0;

  const el = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function arrancar(){
    nave = { x: 128, y: H/2, vy: 0 };
    torres = [];
    score = 0;
    velBase = 190;
    hueco = 168;
    desdeUltima = 260;
    estado = 'jugando';
    el.over.classList.remove('show');
    pintarHud();
  }

  function pintarHud(){
    el.score.textContent = score;
    el.best.textContent = best;
  }

  function impulso(){
    if(estado === 'jugando') nave.vy = IMPULSO;
  }

  function morir(){
    estado = 'fin';
    best = Math.max(best, score);
    window.Hall && Hall.registrar('09-vuelo-rasante', score, { unidad: 'puertas' });
    el.overTitle.textContent = 'CHATARRA';
    el.overText.textContent = 'Pasaste ' + score + (score === 1 ? ' puerta' : ' puertas');
    el.overBtn.textContent = 'OTRO VUELO';
    el.over.classList.add('show');
    pintarHud();
  }

  function nuevaTorre(){
    const margen = 70;
    const centro = margen + hueco/2 + Math.random() * (SUELO - hueco - margen * 2);
    torres.push({ x: W + 30, w: 62, centro, pasada: false });
  }

  function actualizar(dt){
    fondo += velBase * dt * 0.35;

    nave.vy += GRAVEDAD * dt;
    nave.y += nave.vy * dt;

    if(nave.y - NAVE_R < 0){ nave.y = NAVE_R; nave.vy = 0; }
    if(nave.y + NAVE_R > SUELO) return morir();

    desdeUltima += velBase * dt;
    if(desdeUltima >= 250){ desdeUltima = 0; nuevaTorre(); }

    for(const t of torres) t.x -= velBase * dt;
    torres = torres.filter(t => t.x + t.w > -10);

    for(const t of torres){
      const dentroX = nave.x + NAVE_R > t.x && nave.x - NAVE_R < t.x + t.w;
      if(dentroX){
        const arriba = t.centro - hueco/2, abajo = t.centro + hueco/2;
        if(nave.y - NAVE_R < arriba || nave.y + NAVE_R > abajo) return morir();
      }
      if(!t.pasada && t.x + t.w < nave.x - NAVE_R){
        t.pasada = true;
        score++;
        if(score % 5 === 0){
          hueco = Math.max(112, hueco - 8);
          velBase += 14;
        }
        pintarHud();
      }
    }
  }

  function dibujar(){
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0620');
    g.addColorStop(1, '#1b0a2a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ciudad de fondo en parallax
    ctx.fillStyle = 'rgba(53,240,208,.10)';
    for(let i = 0; i < 14; i++){
      const bx = ((i * 91) - (fondo * 0.35) % (W + 120) + W + 120) % (W + 120) - 60;
      const bh = 60 + ((i * 53) % 130);
      ctx.fillRect(bx, SUELO - bh, 46, bh);
    }

    for(const t of torres){
      const arriba = t.centro - hueco/2, abajo = t.centro + hueco/2;
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(t.x, 0, t.w, arriba);
      ctx.fillRect(t.x, abajo, t.w, SUELO - abajo);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(t.x, arriba - 12, t.w, 12);
      ctx.fillRect(t.x, abajo, t.w, 12);
    }

    // suelo
    ctx.fillStyle = '#1b1830';
    ctx.fillRect(0, SUELO, W, H - SUELO);
    ctx.fillStyle = 'var(--volt)';
    ctx.fillStyle = '#35f0d0';
    ctx.fillRect(0, SUELO, W, 2);

    // nave
    const inclina = Math.max(-0.5, Math.min(0.9, nave.vy / 620));
    ctx.save();
    ctx.translate(nave.x, nave.y);
    ctx.rotate(inclina);
    ctx.fillStyle = '#ffb020';
    ctx.shadowColor = '#ffb020'; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(NAVE_R + 6, 0);
    ctx.lineTo(-NAVE_R, -NAVE_R + 2);
    ctx.lineTo(-NAVE_R + 5, 0);
    ctx.lineTo(-NAVE_R, NAVE_R - 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    if(nave.vy < 0){
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(-NAVE_R - 8, -3, 8, 6);
    }
    ctx.restore();
  }

  function pausar(){
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

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(k === 'p'){ pausar(); return; }
    if(k === ' ' || k === 'arrowup'){ e.preventDefault(); impulso(); }
  });
  cv.addEventListener('mousedown', impulso);

  el.overBtn.addEventListener('click', arrancar);

  nave = { x: 128, y: H/2, vy: 0 };
  torres = []; score = 0; velBase = 190; hueco = 168; desdeUltima = 260;
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

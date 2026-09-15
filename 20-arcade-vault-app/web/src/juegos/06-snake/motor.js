/**
 * Motor de la cabina 06-snake.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { cruceta:'cuatro', acciones: [{ k:'p', txt:'PAUSA' }] };

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

  const CELDA = 20;
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const COLS = cv.width / CELDA, FILAS = cv.height / CELDA;

  let cable, dir, colaDir, chispa, score, best = 0, intervalo, acumulado, estado;

  const el = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    len: document.getElementById('len'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function nuevaChispa(){
    let c;
    do {
      c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * FILAS) };
    } while(cable.some(s => s.x === c.x && s.y === c.y));
    return c;
  }

  function arrancar(){
    cable = [{x:8, y:14}, {x:7, y:14}, {x:6, y:14}];
    dir = {x:1, y:0};
    colaDir = {x:1, y:0};
    chispa = nuevaChispa();
    score = 0;
    intervalo = 130;
    acumulado = 0;
    estado = 'jugando';
    el.over.classList.remove('show');
    pintarHud();
  }

  function pintarHud(){
    el.score.textContent = score;
    el.best.textContent = best;
    el.len.textContent = cable.length;
  }

  function morir(){
    estado = 'fin';
    best = Math.max(best, score);
    window.Hall && Hall.registrar('06-snake', score, { unidad: 'pts', etiqueta: 'largo ' + cable.length });
    el.overTitle.textContent = 'GAME OVER';
    el.overText.textContent = score + ' puntos con un cable de ' + cable.length;
    el.overBtn.textContent = 'OTRA PARTIDA';
    el.over.classList.add('show');
    pintarHud();
  }

  function paso(){
    colaDir = dir;
    const cabeza = { x: cable[0].x + dir.x, y: cable[0].y + dir.y };

    if(cabeza.x < 0 || cabeza.y < 0 || cabeza.x >= COLS || cabeza.y >= FILAS) return morir();
    if(cable.some(s => s.x === cabeza.x && s.y === cabeza.y)) return morir();

    cable.unshift(cabeza);

    if(cabeza.x === chispa.x && cabeza.y === chispa.y){
      score += 10;
      chispa = nuevaChispa();
      intervalo = Math.max(60, intervalo - 3);
    } else {
      cable.pop();
    }
    pintarHud();
  }

  function dibujar(){
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, cv.width, cv.height);

    ctx.strokeStyle = 'rgba(46,42,74,.45)';
    ctx.lineWidth = 1;
    for(let i = 1; i < COLS; i++){
      ctx.beginPath(); ctx.moveTo(i * CELDA + .5, 0); ctx.lineTo(i * CELDA + .5, cv.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELDA + .5); ctx.lineTo(cv.width, i * CELDA + .5); ctx.stroke();
    }

    // chispa
    const pulso = 2 + Math.sin(performance.now() / 160) * 1.6;
    ctx.fillStyle = '#ffb020';
    ctx.shadowColor = '#ffb020';
    ctx.shadowBlur = 14;
    ctx.fillRect(chispa.x * CELDA + 4 - pulso / 2, chispa.y * CELDA + 4 - pulso / 2,
                 CELDA - 8 + pulso, CELDA - 8 + pulso);
    ctx.shadowBlur = 0;

    // cable
    cable.forEach((s, i) => {
      const t = i / Math.max(1, cable.length - 1);
      ctx.fillStyle = i === 0 ? '#ff2e88'
        : `rgb(${Math.round(53 + t * 20)}, ${Math.round(240 - t * 120)}, ${Math.round(208 - t * 60)})`;
      ctx.fillRect(s.x * CELDA + 2, s.y * CELDA + 2, CELDA - 4, CELDA - 4);
      if(i === 0){
        ctx.fillStyle = '#fff';
        const ox = dir.x * 4, oy = dir.y * 4;
        ctx.fillRect(s.x * CELDA + 7 + ox, s.y * CELDA + 7 + oy, 3, 3);
      }
    });
  }

  const OPUESTO = (a, b) => a.x === -b.x && a.y === -b.y;

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
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
      return;
    }
    if(estado !== 'jugando') return;

    const mapa = {
      arrowleft:{x:-1,y:0}, a:{x:-1,y:0},
      arrowright:{x:1,y:0},  d:{x:1,y:0},
      arrowup:{x:0,y:-1},    w:{x:0,y:-1},
      arrowdown:{x:0,y:1},   s:{x:0,y:1},
    };
    const nueva = mapa[k];
    if(!nueva) return;
    e.preventDefault();
    // no se permite el giro de 180 grados sobre la dirección ya aplicada
    if(OPUESTO(nueva, colaDir)) return;
    dir = nueva;
  });

  el.overBtn.addEventListener('click', arrancar);

  let ultimo = performance.now();
  function bucle(t){
    const dt = t - ultimo;
    ultimo = t;
    if(estado === 'jugando'){
      acumulado += dt;
      while(acumulado >= intervalo){ acumulado -= intervalo; paso(); }
    }
    dibujar();
    requestAnimationFrame(bucle);
  }

  cable = [{x:8, y:14}, {x:7, y:14}, {x:6, y:14}];
  dir = {x:1, y:0};
  colaDir = {x:1, y:0};
  chispa = nuevaChispa();
  score = 0; intervalo = 130; acumulado = 0; estado = 'menu';
  pintarHud();
  requestAnimationFrame(bucle);
}

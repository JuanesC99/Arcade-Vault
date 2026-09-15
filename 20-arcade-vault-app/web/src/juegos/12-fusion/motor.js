/**
 * Motor de la cabina 12-fusion.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { acciones: [{ k:'r', txt:'NUEVA' }] };

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

  const N = 4;
  const rejillaEl = document.getElementById('rejilla');
  let t, score = 0, best = 0, estado = 'jugando', avisado2048 = false;

  const el = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    max: document.getElementById('max'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  const celdas = [];
  for(let i = 0; i < N * N; i++){
    const d = document.createElement('div');
    d.className = 'f';
    rejillaEl.appendChild(d);
    celdas.push(d);
  }

  function vacias(){
    const v = [];
    for(let y = 0; y < N; y++) for(let x = 0; x < N; x++) if(!t[y][x]) v.push([x, y]);
    return v;
  }

  function meterFicha(){
    const v = vacias();
    if(!v.length) return null;
    const [x, y] = v[Math.floor(Math.random() * v.length)];
    t[y][x] = Math.random() < 0.9 ? 2 : 4;
    return [x, y];
  }

  function pintar(nueva){
    let mayor = 0;
    for(let y = 0; y < N; y++){
      for(let x = 0; x < N; x++){
        const d = celdas[y * N + x];
        const v = t[y][x];
        d.textContent = v || '';
        if(v) d.dataset.v = v; else delete d.dataset.v;
        d.classList.remove('n');
        if(nueva && nueva[0] === x && nueva[1] === y) d.classList.add('n');
        mayor = Math.max(mayor, v || 0);
      }
    }
    el.score.textContent = score;
    el.best.textContent = best;
    el.max.textContent = mayor || 2;

    if(mayor >= 2048 && !avisado2048){
      avisado2048 = true;
      el.overTitle.textContent = '¡2048!';
      el.overText.textContent = 'Puedes seguir jugando para subir más';
      el.overBtn.textContent = 'SEGUIR';
      el.over.classList.add('show');
      estado = 'aviso';
    }
  }

  // Comprime y funde una fila hacia la izquierda. Devuelve la fila nueva.
  function fundirFila(fila){
    const vals = fila.filter(v => v);
    const salida = [];
    for(let i = 0; i < vals.length; i++){
      if(vals[i] === vals[i + 1]){
        const suma = vals[i] * 2;
        salida.push(suma);
        score += suma;
        i++;
      } else {
        salida.push(vals[i]);
      }
    }
    while(salida.length < N) salida.push(0);
    return salida;
  }

  const filas    = m => m.map(f => [...f]);
  const alReves  = m => m.map(f => [...f].reverse());
  const transpon = m => m[0].map((_, x) => m.map(f => f[x]));

  function mover(dir){
    if(estado !== 'jugando') return;
    const antes = JSON.stringify(t);

    let m = filas(t);
    if(dir === 'arriba')   m = transpon(m);
    if(dir === 'abajo')    m = alReves(transpon(m));
    if(dir === 'derecha')  m = alReves(m);

    m = m.map(fundirFila);

    if(dir === 'arriba')   m = transpon(m);
    if(dir === 'abajo')    m = transpon(alReves(m));
    if(dir === 'derecha')  m = alReves(m);

    t = m;

    if(JSON.stringify(t) === antes){ pintar(); return; }

    best = Math.max(best, score);
    const nueva = meterFicha();
    pintar(nueva);
    if(!hayMovimientos()) terminar();
  }

  function hayMovimientos(){
    if(vacias().length) return true;
    for(let y = 0; y < N; y++)
      for(let x = 0; x < N; x++){
        if(x < N - 1 && t[y][x] === t[y][x + 1]) return true;
        if(y < N - 1 && t[y][x] === t[y + 1][x]) return true;
      }
    return false;
  }

  function terminar(){
    estado = 'fin';
    window.Hall && Hall.registrar('12-fusion', score, { unidad: 'pts', etiqueta: 'ficha ' + el.max.textContent });
    el.overTitle.textContent = 'SIN MOVIMIENTOS';
    el.overText.textContent = score + ' puntos · mayor ficha ' + el.max.textContent;
    el.overBtn.textContent = 'OTRA PARTIDA';
    el.over.classList.add('show');
  }

  function nueva(){
    t = Array.from({length:N}, () => Array(N).fill(0));
    score = 0;
    estado = 'jugando';
    avisado2048 = false;
    el.over.classList.remove('show');
    meterFicha();
    pintar(meterFicha());
  }

  const MAPA = {
    arrowleft:'izquierda', a:'izquierda',
    arrowright:'derecha',  d:'derecha',
    arrowup:'arriba',      w:'arriba',
    arrowdown:'abajo',     s:'abajo',
  };

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(k === 'r'){ nueva(); return; }
    const dir = MAPA[k];
    if(!dir) return;
    e.preventDefault();
    mover(dir);
  });

  /* ---------- arrastre con el ratón (y con el dedo) ----------
     Se toma la dirección del eje que más se ha movido, con un mínimo
     de UMBRAL píxeles para no disparar el movimiento con un clic seco. */
  const UMBRAL = 24;
  let inicio = null;

  function direccionDelGesto(dx, dy){
    if(Math.max(Math.abs(dx), Math.abs(dy)) < UMBRAL) return null;
    if(Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'derecha' : 'izquierda';
    return dy > 0 ? 'abajo' : 'arriba';
  }

  rejillaEl.addEventListener('pointerdown', e => {
    if(estado !== 'jugando') return;
    inicio = { x: e.clientX, y: e.clientY };
    rejillaEl.classList.add('arrastrando');
    rejillaEl.setPointerCapture(e.pointerId);
  });

  rejillaEl.addEventListener('pointermove', e => {
    if(!inicio) return;
    // en cuanto se supera el umbral se mueve y se cierra el gesto,
    // así un arrastre largo no encadena movimientos sin querer
    const dir = direccionDelGesto(e.clientX - inicio.x, e.clientY - inicio.y);
    if(!dir) return;
    inicio = null;
    rejillaEl.classList.remove('arrastrando');
    mover(dir);
  });

  function soltarGesto(){
    inicio = null;
    rejillaEl.classList.remove('arrastrando');
  }
  rejillaEl.addEventListener('pointerup', soltarGesto);
  rejillaEl.addEventListener('pointercancel', soltarGesto);
  rejillaEl.addEventListener('pointerleave', soltarGesto);

  el.overBtn.addEventListener('click', () => {
    if(estado === 'aviso'){
      estado = 'jugando';
      el.over.classList.remove('show');
    } else {
      nueva();
    }
  });

  nueva();
}

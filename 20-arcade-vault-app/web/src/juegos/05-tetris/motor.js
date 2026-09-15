/**
 * Motor de la cabina 05-tetris.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { cruceta:'tetris', acciones: [{ k:' ', txt:'SOLTAR' }, { k:'p', txt:'PAUSA' }] };

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

  const COLS = 10, ROWS = 20, CELL = 30;
  const board = document.getElementById('board');
  const ctx = board.getContext('2d');
  const nextCv = document.getElementById('next');
  const nctx = nextCv.getContext('2d');

  const PIEZAS = {
    I: { color:'#35f0d0', celdas:[[0,1],[1,1],[2,1],[3,1]], w:4 },
    J: { color:'#5b8cff', celdas:[[0,0],[0,1],[1,1],[2,1]], w:3 },
    L: { color:'#ffb020', celdas:[[2,0],[0,1],[1,1],[2,1]], w:3 },
    O: { color:'#ffe066', celdas:[[1,0],[2,0],[1,1],[2,1]], w:4 },
    S: { color:'#7ce85c', celdas:[[1,0],[2,0],[0,1],[1,1]], w:3 },
    T: { color:'#ff2e88', celdas:[[1,0],[0,1],[1,1],[2,1]], w:3 },
    Z: { color:'#ff5a5a', celdas:[[0,0],[1,0],[1,1],[2,1]], w:3 },
  };
  const TIPOS = Object.keys(PIEZAS);

  let rejilla, pieza, siguiente, bolsa = [];
  let score = 0, lines = 0, level = 1;
  let caida = 0, intervalo = 0, estado = 'jugando';

  const el = {
    score: document.getElementById('score'),
    lines: document.getElementById('lines'),
    level: document.getElementById('level'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function vaciarRejilla(){
    return Array.from({length:ROWS}, () => Array(COLS).fill(null));
  }

  // Bolsa de siete: cada pieza sale una vez antes de repetirse
  function sacarTipo(){
    if(!bolsa.length){
      bolsa = [...TIPOS];
      for(let i = bolsa.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]];
      }
    }
    return bolsa.pop();
  }

  function crearPieza(tipo){
    const base = PIEZAS[tipo];
    return {
      tipo,
      color: base.color,
      w: base.w,
      celdas: base.celdas.map(c => [...c]),
      x: Math.floor((COLS - base.w) / 2),
      y: -1,
    };
  }

  function celdasAbsolutas(p, dx = 0, dy = 0, celdas = p.celdas){
    return celdas.map(([cx, cy]) => [p.x + cx + dx, p.y + cy + dy]);
  }

  function choca(p, dx = 0, dy = 0, celdas = p.celdas){
    return celdasAbsolutas(p, dx, dy, celdas).some(([x, y]) =>
      x < 0 || x >= COLS || y >= ROWS || (y >= 0 && rejilla[y][x])
    );
  }

  function girar(p){
    if(p.tipo === 'O') return p.celdas;
    const n = p.w - 1;
    return p.celdas.map(([x, y]) => [n - y, x]);
  }

  function intentarGiro(){
    const giradas = girar(pieza);
    // patadas: prueba en el sitio, a un lado, al otro y arriba
    for(const [dx, dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]]){
      if(!choca(pieza, dx, dy, giradas)){
        pieza.celdas = giradas;
        pieza.x += dx;
        pieza.y += dy;
        return;
      }
    }
  }

  function fijar(){
    for(const [x, y] of celdasAbsolutas(pieza)){
      if(y < 0){ terminar(); return; }
      rejilla[y][x] = pieza.color;
    }
    limpiarLineas();
    nuevaPieza();
  }

  function limpiarLineas(){
    let hechas = 0;
    for(let y = ROWS - 1; y >= 0; y--){
      if(rejilla[y].every(c => c)){
        rejilla.splice(y, 1);
        rejilla.unshift(Array(COLS).fill(null));
        hechas++;
        y++;
      }
    }
    if(!hechas) return;
    const premio = [0, 100, 300, 500, 800][hechas];
    score += premio * level;
    lines += hechas;
    level = Math.floor(lines / 10) + 1;
    intervalo = Math.max(90, 800 - (level - 1) * 65);
    pintarHud();
  }

  function nuevaPieza(){
    pieza = siguiente || crearPieza(sacarTipo());
    siguiente = crearPieza(sacarTipo());
    if(choca(pieza)) terminar();
    dibujarSiguiente();
  }

  function terminar(){
    estado = 'fin';
    window.Hall && Hall.registrar('05-tetris', score, { unidad: 'pts', etiqueta: lines + ' líneas' });
    el.overTitle.textContent = 'GAME OVER';
    el.overText.textContent = 'Hiciste ' + score + ' puntos con ' + lines + ' líneas';
    el.overBtn.style.display = 'block';
    el.over.classList.add('show');
  }

  function pintarHud(){
    el.score.textContent = score;
    el.lines.textContent = lines;
    el.level.textContent = level;
  }

  function bloque(c, x, y, tam){
    c.fillStyle = '#000';
    c.fillRect(x, y, tam, tam);
    c.fillStyle = pintaActual;
    c.fillRect(x + 1, y + 1, tam - 2, tam - 2);
    c.fillStyle = 'rgba(255,255,255,.28)';
    c.fillRect(x + 1, y + 1, tam - 2, 3);
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.fillRect(x + 1, y + tam - 4, tam - 2, 3);
  }
  let pintaActual = '#fff';

  function dibujar(){
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, board.width, board.height);

    // rejilla de fondo
    ctx.strokeStyle = 'rgba(46,42,74,.5)';
    ctx.lineWidth = 1;
    for(let x = 1; x < COLS; x++){
      ctx.beginPath(); ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, board.height); ctx.stroke();
    }
    for(let y = 1; y < ROWS; y++){
      ctx.beginPath(); ctx.moveTo(0, y * CELL + .5); ctx.lineTo(board.width, y * CELL + .5); ctx.stroke();
    }

    for(let y = 0; y < ROWS; y++)
      for(let x = 0; x < COLS; x++)
        if(rejilla[y][x]){ pintaActual = rejilla[y][x]; bloque(ctx, x * CELL, y * CELL, CELL); }

    if(pieza && estado !== 'fin'){
      // sombra de aterrizaje
      let d = 0;
      while(!choca(pieza, 0, d + 1)) d++;
      ctx.globalAlpha = .18;
      pintaActual = pieza.color;
      for(const [x, y] of celdasAbsolutas(pieza, 0, d))
        if(y >= 0) bloque(ctx, x * CELL, y * CELL, CELL);
      ctx.globalAlpha = 1;

      for(const [x, y] of celdasAbsolutas(pieza))
        if(y >= 0) bloque(ctx, x * CELL, y * CELL, CELL);
    }
  }

  function dibujarSiguiente(){
    nctx.fillStyle = '#12101f';
    nctx.fillRect(0, 0, nextCv.width, nextCv.height);
    if(!siguiente) return;
    const tam = 24;
    const xs = siguiente.celdas.map(c => c[0]);
    const ys = siguiente.celdas.map(c => c[1]);
    const ox = (nextCv.width - (Math.max(...xs) - Math.min(...xs) + 1) * tam) / 2 - Math.min(...xs) * tam;
    const oy = (nextCv.height - (Math.max(...ys) - Math.min(...ys) + 1) * tam) / 2 - Math.min(...ys) * tam;
    pintaActual = siguiente.color;
    for(const [x, y] of siguiente.celdas) bloque(nctx, ox + x * tam, oy + y * tam, tam);
  }

  function bajar(){
    if(choca(pieza, 0, 1)) fijar();
    else pieza.y++;
  }

  function soltar(){
    while(!choca(pieza, 0, 1)){ pieza.y++; score += 2; }
    fijar();
    pintarHud();
  }

  document.addEventListener('keydown', e => {
    if(e.key === 'p' || e.key === 'P'){
      if(estado === 'jugando'){
        estado = 'pausa';
        el.overTitle.textContent = 'PAUSA';
        el.overText.textContent = 'Pulsa P para seguir';
        el.overBtn.style.display = 'none';
        el.over.classList.add('show');
      } else if(estado === 'pausa'){
        estado = 'jugando';
        el.over.classList.remove('show');
      }
      return;
    }
    if(estado !== 'jugando') return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    if(e.key === 'ArrowLeft'  && !choca(pieza, -1, 0)) pieza.x--;
    if(e.key === 'ArrowRight' && !choca(pieza,  1, 0)) pieza.x++;
    if(e.key === 'ArrowUp') intentarGiro();
    if(e.key === 'ArrowDown'){ bajar(); score++; pintarHud(); caida = 0; }
    if(e.key === ' ') soltar();
  });

  el.overBtn.addEventListener('click', arrancar);

  function arrancar(){
    rejilla = vaciarRejilla();
    bolsa = [];
    siguiente = null;
    score = 0; lines = 0; level = 1;
    intervalo = 800; caida = 0;
    estado = 'jugando';
    el.over.classList.remove('show');
    el.overBtn.style.display = 'none';
    nuevaPieza();
    pintarHud();
  }

  let ultimo = performance.now();
  function bucle(t){
    const dt = t - ultimo;
    ultimo = t;
    if(estado === 'jugando'){
      caida += dt;
      if(caida >= intervalo){ caida = 0; bajar(); }
    }
    dibujar();
    requestAnimationFrame(bucle);
  }

  arrancar();
  requestAnimationFrame(bucle);
}

/**
 * Motor de la cabina 16-cuatro-en-linea.
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

  const COLS = 7, FILAS = 6, CELDA = 80;
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');

  const VACIO = 0, YO = 1, RIVAL = 2;
  const COLOR = { 1: '#ff2e88', 2: '#ffb020' };

  let t, turno, estado, ganadora, fichas, ganadas = 0;
  let contraMaquina = true, profundidad = 4, columnaRaton = -1, cayendo = null;

  const el = {
    turnoTexto: document.getElementById('turnoTexto'),
    turno: document.getElementById('turno'),
    fichas: document.getElementById('fichas'),
    ganadas: document.getElementById('ganadas'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  const tableroVacio = () => Array.from({length:FILAS}, () => Array(COLS).fill(VACIO));

  function huecoLibre(tab, col){
    for(let f = FILAS - 1; f >= 0; f--) if(tab[f][col] === VACIO) return f;
    return -1;
  }

  const columnasLibres = tab => {
    const l = [];
    for(let c = 0; c < COLS; c++) if(huecoLibre(tab, c) >= 0) l.push(c);
    return l;
  };

  /* Devuelve las cuatro casillas ganadoras, o null. */
  function lineaGanadora(tab, jugador){
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for(let f = 0; f < FILAS; f++){
      for(let c = 0; c < COLS; c++){
        if(tab[f][c] !== jugador) continue;
        for(const [df, dc] of dirs){
          const linea = [[f,c]];
          for(let k = 1; k < 4; k++){
            const nf = f + df*k, nc = c + dc*k;
            if(nf < 0 || nc < 0 || nf >= FILAS || nc >= COLS || tab[nf][nc] !== jugador) break;
            linea.push([nf, nc]);
          }
          if(linea.length === 4) return linea;
        }
      }
    }
    return null;
  }

  /* ---------------- la máquina ----------------
     Minimax con poda alfa-beta. La heurística cuenta ventanas de
     cuatro casillas y premia las que ya tienen fichas propias. */
  function puntuarVentana(v, jugador){
    const otro = jugador === YO ? RIVAL : YO;
    const mias = v.filter(x => x === jugador).length;
    const suyas = v.filter(x => x === otro).length;
    const libres = v.filter(x => x === VACIO).length;
    if(mias === 4) return 10000;
    if(mias === 3 && libres === 1) return 60;
    if(mias === 2 && libres === 2) return 8;
    if(suyas === 3 && libres === 1) return -85;   // tapar pesa más que atacar
    return 0;
  }

  function evaluar(tab, jugador){
    let total = 0;
    // el centro vale porque abre más líneas
    for(let f = 0; f < FILAS; f++) if(tab[f][3] === jugador) total += 7;

    const mirar = (f, c, df, dc) => {
      const v = [];
      for(let k = 0; k < 4; k++) v.push(tab[f + df*k][c + dc*k]);
      total += puntuarVentana(v, jugador);
    };
    for(let f = 0; f < FILAS; f++)
      for(let c = 0; c < COLS - 3; c++) mirar(f, c, 0, 1);
    for(let f = 0; f < FILAS - 3; f++)
      for(let c = 0; c < COLS; c++) mirar(f, c, 1, 0);
    for(let f = 0; f < FILAS - 3; f++)
      for(let c = 0; c < COLS - 3; c++) mirar(f, c, 1, 1);
    for(let f = 3; f < FILAS; f++)
      for(let c = 0; c < COLS - 3; c++) mirar(f, c, -1, 1);

    return total;
  }

  function minimax(tab, prof, alfa, beta, maximiza){
    const libres = columnasLibres(tab);
    const ganaRival = lineaGanadora(tab, RIVAL);
    const ganaYo = lineaGanadora(tab, YO);

    if(ganaRival) return { col: null, valor: 1000000 + prof };
    if(ganaYo)    return { col: null, valor: -1000000 - prof };
    if(!libres.length) return { col: null, valor: 0 };
    if(prof === 0) return { col: null, valor: evaluar(tab, RIVAL) - evaluar(tab, YO) };

    // probar primero las columnas centrales acelera la poda
    const orden = [...libres].sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    let mejorCol = orden[0];

    if(maximiza){
      let mejor = -Infinity;
      for(const c of orden){
        const f = huecoLibre(tab, c);
        tab[f][c] = RIVAL;
        const v = minimax(tab, prof - 1, alfa, beta, false).valor;
        tab[f][c] = VACIO;
        if(v > mejor){ mejor = v; mejorCol = c; }
        alfa = Math.max(alfa, mejor);
        if(alfa >= beta) break;
      }
      return { col: mejorCol, valor: mejor };
    }

    let peor = Infinity;
    for(const c of orden){
      const f = huecoLibre(tab, c);
      tab[f][c] = YO;
      const v = minimax(tab, prof - 1, alfa, beta, true).valor;
      tab[f][c] = VACIO;
      if(v < peor){ peor = v; mejorCol = c; }
      beta = Math.min(beta, peor);
      if(alfa >= beta) break;
    }
    return { col: mejorCol, valor: peor };
  }

  /* ---------------- partida ---------------- */
  function nueva(){
    t = tableroVacio();
    turno = YO;
    estado = 'jugando';
    ganadora = null;
    fichas = 0;
    cayendo = null;
    el.over.classList.remove('show');
    pintarHud();
  }

  function pintarHud(){
    el.fichas.textContent = fichas;
    el.ganadas.textContent = ganadas;
    const punto = el.turno.querySelector('.punto');
    punto.className = 'punto ' + (turno === YO ? 'p1' : 'p2');
    el.turnoTexto.textContent = turno === YO
      ? 'Tú'
      : (contraMaquina ? 'Máquina' : 'Jugador 2');
  }

  function terminar(quien){
    estado = 'fin';
    if(quien === 'empate'){
      el.overTitle.textContent = 'EMPATE';
      el.overText.textContent = 'Tablero lleno con ' + fichas + ' fichas';
    } else if(quien === YO){
      ganadas++;
      el.overTitle.textContent = 'GANASTE';
      el.overText.textContent = 'Cuatro en línea con ' + fichas + ' fichas en juego';
      if(contraMaquina){
        const nivel = profundidad === 2 ? 'fácil' : profundidad === 4 ? 'normal' : 'duro';
        window.Hall && Hall.registrar('16-cuatro-en-linea', fichas, { unidad: 'fichas', menorEsMejor: true, etiqueta: nivel });
      }
    } else {
      el.overTitle.textContent = contraMaquina ? 'GANÓ LA MÁQUINA' : 'GANÓ EL JUGADOR 2';
      el.overText.textContent = 'Te faltó tapar una línea';
    }
    el.overBtn.textContent = 'OTRA PARTIDA';
    pintarHud();
    setTimeout(() => el.over.classList.add('show'), 900);
  }

  /* Deja la ficha en su hueco y pasa el turno. */
  function posar(){
    if(!cayendo) return;
    const { col, filaDestino, jugador } = cayendo;
    t[filaDestino][col] = jugador;
    fichas++;
    cayendo = null;
    tras(jugador);
  }

  function soltar(col){
    if(estado !== 'jugando' || cayendo) return;
    const f = huecoLibre(t, col);
    if(f < 0) return;

    const quien = turno;
    // animación de caída: la ficha baja desde arriba hasta su hueco
    cayendo = { col, filaDestino: f, y: -CELDA, jugador: quien };

    // Chrome congela requestAnimationFrame en pestañas ocultas: sin esto la
    // ficha se quedaba a medio caer y `cayendo` bloqueaba el tablero para
    // siempre. Fuera de vista no hay animación que ver, así que la posamos ya.
    if(document.hidden) return posar();

    const paso = () => {
      if(!cayendo) return;
      cayendo.y += 46;
      if(cayendo.y >= cayendo.filaDestino * CELDA) return posar();
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  // Si la pestaña se esconde con una ficha en el aire, la resolvemos al vuelo.
  document.addEventListener('visibilitychange', () => { if(document.hidden) posar(); });

  function tras(quien){
    const linea = lineaGanadora(t, quien);
    if(linea){ ganadora = linea; return terminar(quien); }
    if(!columnasLibres(t).length) return terminar('empate');

    turno = quien === YO ? RIVAL : YO;
    pintarHud();

    if(contraMaquina && turno === RIVAL){
      estado = 'pensando';
      setTimeout(() => {
        const { col } = minimax(t.map(f => [...f]), profundidad, -Infinity, Infinity, true);
        estado = 'jugando';
        soltar(col == null ? columnasLibres(t)[0] : col);
      }, 260);
    }
  }

  /* ---------------- dibujo ---------------- */
  function circulo(cx, cy, r){
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function dibujar(){
    const R = CELDA/2 - 8;

    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, cv.width, cv.height);

    // columna resaltada bajo el ratón
    if(estado === 'jugando' && !cayendo && columnaRaton >= 0 && huecoLibre(t, columnaRaton) >= 0){
      ctx.fillStyle = 'rgba(53,240,208,.10)';
      ctx.fillRect(columnaRaton * CELDA, 0, CELDA, cv.height);
    }

    // panel del tablero
    ctx.fillStyle = '#1b1830';
    ctx.fillRect(6, 6, cv.width - 12, cv.height - 12);

    // huecos y fichas
    for(let f = 0; f < FILAS; f++){
      for(let c = 0; c < COLS; c++){
        const cx = c * CELDA + CELDA/2, cy = f * CELDA + CELDA/2;
        const v = t[f][c];
        ctx.fillStyle = v ? COLOR[v] : '#0a0814';
        circulo(cx, cy, R);
        if(v){
          ctx.fillStyle = 'rgba(255,255,255,.22)';
          circulo(cx - R*0.28, cy - R*0.3, R*0.28);
        }
      }
    }

    // la ficha que está cayendo pasa por delante del panel
    if(cayendo){
      ctx.fillStyle = COLOR[cayendo.jugador];
      circulo(cayendo.col * CELDA + CELDA/2, cayendo.y + CELDA/2, R);
    }

    // línea ganadora
    if(ganadora){
      ctx.strokeStyle = '#35f0d0';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#35f0d0';
      ctx.shadowBlur = 18;
      const a = ganadora[0], b = ganadora[3];
      ctx.beginPath();
      ctx.moveTo(a[1]*CELDA + CELDA/2, a[0]*CELDA + CELDA/2);
      ctx.lineTo(b[1]*CELDA + CELDA/2, b[0]*CELDA + CELDA/2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  /* ---------------- entrada ---------------- */
  function columnaDe(e){
    const r = cv.getBoundingClientRect();
    return Math.floor((e.clientX - r.left) * (cv.width / r.width) / CELDA);
  }

  cv.addEventListener('mousemove', e => { columnaRaton = columnaDe(e); });
  cv.addEventListener('mouseleave', () => { columnaRaton = -1; });
  cv.addEventListener('click', e => {
    if(estado !== 'jugando') return;
    if(contraMaquina && turno !== YO) return;
    const c = columnaDe(e);
    if(c >= 0 && c < COLS) soltar(c);
  });

  document.addEventListener('keydown', e => {
    if(e.key.toLowerCase() === 'r'){ nueva(); return; }
    const n = parseInt(e.key, 10);
    if(n >= 1 && n <= COLS && estado === 'jugando'){
      if(contraMaquina && turno !== YO) return;
      soltar(n - 1);
    }
  });

  document.getElementById('rival').addEventListener('click', e => {
    const b = e.target.closest('button');
    if(!b) return;
    document.querySelectorAll('#rival button').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    contraMaquina = b.dataset.r === 'maquina';
    nueva();
  });

  document.getElementById('nivel').addEventListener('click', e => {
    const b = e.target.closest('button');
    if(!b) return;
    document.querySelectorAll('#nivel button').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    profundidad = +b.dataset.n;
    nueva();
  });

  el.overBtn.addEventListener('click', nueva);

  nueva();
  (function bucle(){ dibujar(); requestAnimationFrame(bucle); })();
}

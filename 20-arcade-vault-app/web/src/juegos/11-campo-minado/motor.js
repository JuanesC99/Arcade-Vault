/**
 * Motor de la cabina 11-campo-minado.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { alterno: { txt:'BANDERA', selector:'#tablero', evento:'contextmenu' }, acciones: [{ k:'r', txt:'NUEVA' }] };

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

  const NIVELES = {
    facil: { cols: 9,  filas: 9,  minas: 10 },
    medio: { cols: 14, filas: 12, minas: 28 },
    duro:  { cols: 18, filas: 14, minas: 48 },
  };

  const tablero = document.getElementById('tablero');
  let nivel = 'facil', celdas = [], cols, filas, totalMinas;
  let sembrado = false, estado = 'jugando', banderas = 0, t0 = 0, cron = null;

  const el = {
    minas: document.getElementById('minas'),
    tiempo: document.getElementById('tiempo'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  const idx = (x, y) => y * cols + x;
  const dentro = (x, y) => x >= 0 && y >= 0 && x < cols && y < filas;

  function vecinas(x, y){
    const v = [];
    for(let dy = -1; dy <= 1; dy++)
      for(let dx = -1; dx <= 1; dx++)
        if((dx || dy) && dentro(x + dx, y + dy)) v.push(celdas[idx(x + dx, y + dy)]);
    return v;
  }

  function nueva(){
    const cfg = NIVELES[nivel];
    cols = cfg.cols; filas = cfg.filas; totalMinas = cfg.minas;
    sembrado = false; estado = 'jugando'; banderas = 0;
    clearInterval(cron); cron = null;
    el.tiempo.textContent = '0';
    el.minas.textContent = totalMinas;
    el.over.classList.remove('show');

    celdas = [];
    tablero.innerHTML = '';
    tablero.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    for(let y = 0; y < filas; y++){
      for(let x = 0; x < cols; x++){
        const div = document.createElement('div');
        div.className = 'c';
        div.dataset.x = x; div.dataset.y = y;
        tablero.appendChild(div);
        celdas.push({ x, y, div, mina:false, abierta:false, bandera:false, num:0 });
      }
    }
  }

  function sembrar(sinMinaX, sinMinaY){
    const prohibidas = new Set([idx(sinMinaX, sinMinaY)]);
    vecinas(sinMinaX, sinMinaY).forEach(c => prohibidas.add(idx(c.x, c.y)));

    let puestas = 0;
    while(puestas < totalMinas){
      const i = Math.floor(Math.random() * celdas.length);
      if(prohibidas.has(i) || celdas[i].mina) continue;
      celdas[i].mina = true;
      puestas++;
    }
    for(const c of celdas)
      c.num = vecinas(c.x, c.y).filter(v => v.mina).length;

    sembrado = true;
    t0 = Date.now();
    cron = setInterval(() => {
      if(estado === 'jugando') el.tiempo.textContent = Math.floor((Date.now() - t0) / 1000);
    }, 250);
  }

  function pintar(c){
    c.div.className = 'c';
    if(c.bandera && !c.abierta){ c.div.classList.add('bandera'); c.div.textContent = '⚑'; return; }
    if(!c.abierta){ c.div.textContent = ''; return; }
    c.div.classList.add('abierta');
    if(c.mina){ c.div.classList.add('mina'); c.div.textContent = '✸'; return; }
    c.div.textContent = c.num || '';
    if(c.num) c.div.classList.add('n' + c.num);
  }

  function abrir(c){
    if(c.abierta || c.bandera || estado !== 'jugando') return;
    c.abierta = true;
    pintar(c);
    if(c.mina) return perder(c);
    if(c.num === 0) vecinas(c.x, c.y).forEach(abrir);
  }

  function perder(cBoom){
    estado = 'fin';
    clearInterval(cron);
    for(const c of celdas) if(c.mina){ c.abierta = true; pintar(c); }
    cBoom.div.style.background = '#ff5a5a';
    el.overTitle.textContent = 'BOOM';
    el.overText.textContent = 'Pisaste una mina en ' + el.tiempo.textContent + ' segundos';
    el.over.classList.add('show');
  }

  function comprobarVictoria(){
    const faltan = celdas.filter(c => !c.mina && !c.abierta).length;
    if(faltan) return;
    estado = 'fin';
    clearInterval(cron);
    for(const c of celdas) if(c.mina && !c.bandera){ c.bandera = true; pintar(c); }
    window.Hall && Hall.registrar('11-campo-minado', Number(el.tiempo.textContent), { unidad: 's', menorEsMejor: true, etiqueta: nivel });
    el.overTitle.textContent = 'CAMPO LIMPIO';
    el.overText.textContent = 'Las ' + totalMinas + ' minas en ' + el.tiempo.textContent + ' segundos';
    el.over.classList.add('show');
  }

  tablero.addEventListener('click', e => {
    const div = e.target.closest('.c');
    if(!div || estado !== 'jugando') return;
    const c = celdas[idx(+div.dataset.x, +div.dataset.y)];
    if(!sembrado) sembrar(c.x, c.y);
    abrir(c);
    if(estado === 'jugando') comprobarVictoria();
  });

  tablero.addEventListener('contextmenu', e => {
    e.preventDefault();
    const div = e.target.closest('.c');
    if(!div || estado !== 'jugando') return;
    const c = celdas[idx(+div.dataset.x, +div.dataset.y)];
    if(c.abierta) return;
    c.bandera = !c.bandera;
    banderas += c.bandera ? 1 : -1;
    el.minas.textContent = Math.max(0, totalMinas - banderas);
    pintar(c);
  });

  document.querySelectorAll('.niveles button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.niveles button').forEach(o => o.classList.remove('on'));
      b.classList.add('on');
      nivel = b.dataset.n;
      nueva();
    });
  });

  document.addEventListener('keydown', e => {
    if(e.key.toLowerCase() === 'r') nueva();
  });

  el.overBtn.addEventListener('click', nueva);

  nueva();
}

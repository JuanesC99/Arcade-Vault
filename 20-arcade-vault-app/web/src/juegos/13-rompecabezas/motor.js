/**
 * Motor de la cabina 13-rompecabezas.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { acciones: [{ k:'r', txt:'BARAJAR' }] };

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

  const LADO = 460;          // lado del tablero en píxeles
  let N = 4;                 // piezas por lado
  let cuadro = 0;            // qué dibujo se está armando
  let orden = [];            // orden[casilla] = índice de la pieza que hay allí
  let piezas = [];           // los divs, uno por casilla
  let imagen = '';           // el dibujo como data URL
  let movs = 0, t0 = 0, cron = null, estado = 'jugando';

  const tablero = document.getElementById('tablero');
  const original = document.getElementById('original');
  const stage = document.getElementById('stage');

  const el = {
    movs: document.getElementById('movs'),
    tiempo: document.getElementById('tiempo'),
    encajadas: document.getElementById('encajadas'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  /* ------------------------------------------------------------
     Los cuadros se dibujan con canvas, así no hace falta ninguna
     imagen externa y el archivo sigue siendo autocontenido.
     ------------------------------------------------------------ */
  function pintarCuadro(cual){
    const c = document.createElement('canvas');
    c.width = c.height = LADO;
    const x = c.getContext('2d');

    if(cual === 0){
      // atardecer sintético
      const g = x.createLinearGradient(0, 0, 0, LADO);
      g.addColorStop(0, '#2a0a3d'); g.addColorStop(.55, '#7a1050'); g.addColorStop(1, '#ff6a3d');
      x.fillStyle = g; x.fillRect(0, 0, LADO, LADO);

      x.fillStyle = '#ffe066';
      x.beginPath(); x.arc(LADO/2, LADO*.46, LADO*.20, 0, Math.PI*2); x.fill();
      x.fillStyle = 'rgba(122,16,80,.85)';
      for(let i = 0; i < 7; i++) x.fillRect(LADO*.28, LADO*.40 + i*16, LADO*.44, 7);

      x.fillStyle = '#12061e';
      x.beginPath();
      x.moveTo(0, LADO*.72);
      x.lineTo(LADO*.22, LADO*.55); x.lineTo(LADO*.40, LADO*.70);
      x.lineTo(LADO*.62, LADO*.48); x.lineTo(LADO*.82, LADO*.68);
      x.lineTo(LADO, LADO*.58); x.lineTo(LADO, LADO); x.lineTo(0, LADO);
      x.closePath(); x.fill();

      x.strokeStyle = 'rgba(53,240,208,.5)'; x.lineWidth = 1;
      for(let i = 1; i < 12; i++){
        const yy = LADO*.72 + (i*i) * 1.6;
        if(yy > LADO) break;
        x.beginPath(); x.moveTo(0, yy); x.lineTo(LADO, yy); x.stroke();
      }
    }

    if(cual === 1){
      // circuito
      x.fillStyle = '#06121f'; x.fillRect(0, 0, LADO, LADO);
      x.strokeStyle = 'rgba(53,240,208,.75)'; x.lineWidth = 3;
      for(let i = 0; i < 26; i++){
        let px = Math.floor(Math.random()*10)*(LADO/10);
        let py = Math.floor(Math.random()*10)*(LADO/10);
        x.beginPath(); x.moveTo(px, py);
        for(let p = 0; p < 4; p++){
          if(Math.random() < .5) px += (Math.random()<.5?-1:1)*(LADO/10);
          else py += (Math.random()<.5?-1:1)*(LADO/10);
          x.lineTo(px, py);
        }
        x.stroke();
        x.fillStyle = '#ff2e88';
        x.fillRect(px-4, py-4, 8, 8);
      }
      x.fillStyle = 'rgba(255,176,32,.9)';
      for(let i = 0; i < 34; i++)
        x.fillRect(Math.random()*LADO, Math.random()*LADO, 5, 5);
    }

    if(cual === 2){
      // vidriera
      x.fillStyle = '#0d0b18'; x.fillRect(0, 0, LADO, LADO);
      const cols = ['#ff2e88','#35f0d0','#ffb020','#7c6bff','#7ce85c','#ff5a5a'];
      for(let i = 0; i < 16; i++){
        x.fillStyle = cols[i % cols.length];
        x.globalAlpha = .78;
        x.beginPath();
        const cx2 = Math.random()*LADO, cy2 = Math.random()*LADO, r = 40 + Math.random()*110;
        const lados = 3 + Math.floor(Math.random()*4);
        for(let s = 0; s <= lados; s++){
          const a = (s/lados)*Math.PI*2 + i;
          const px = cx2 + Math.cos(a)*r, py = cy2 + Math.sin(a)*r;
          s ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.closePath(); x.fill();
      }
      x.globalAlpha = 1;
      x.strokeStyle = '#05040c'; x.lineWidth = 6;
      for(let i = 0; i <= 6; i++){
        x.beginPath(); x.moveTo(i*LADO/6, 0); x.lineTo(i*LADO/6, LADO); x.stroke();
        x.beginPath(); x.moveTo(0, i*LADO/6); x.lineTo(LADO, i*LADO/6); x.stroke();
      }
    }

    return c.toDataURL();
  }

  function barajar(){
    do {
      orden = [...Array(N*N).keys()];
      for(let i = orden.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [orden[i], orden[j]] = [orden[j], orden[i]];
      }
    } while(orden.every((v, i) => v === i));   // nunca empezar resuelto
  }

  function tamPieza(){
    return (LADO - (N - 1) * 3) / N;
  }

  function estiloPieza(div, pieza){
    const p = tamPieza();
    const col = pieza % N, fil = Math.floor(pieza / N);
    div.style.backgroundImage = `url(${imagen})`;
    div.style.backgroundSize = `${p * N}px ${p * N}px`;
    div.style.backgroundPosition = `${-col * p}px ${-fil * p}px`;
  }

  function construir(){
    const p = tamPieza();
    tablero.style.gridTemplateColumns = `repeat(${N}, ${p}px)`;
    tablero.style.gridTemplateRows = `repeat(${N}, ${p}px)`;
    tablero.innerHTML = '';
    piezas = [];
    for(let i = 0; i < N*N; i++){
      const d = document.createElement('div');
      d.className = 'pieza';
      d.style.width = p + 'px';
      d.style.height = p + 'px';
      d.dataset.casilla = i;
      tablero.appendChild(d);
      piezas.push(d);
    }
    original.style.backgroundImage = `url(${imagen})`;
    pintarTodo();
  }

  function pintarTodo(){
    let bien = 0;
    orden.forEach((pieza, casilla) => {
      const d = piezas[casilla];
      estiloPieza(d, pieza);
      const encajada = pieza === casilla;
      d.classList.toggle('encajada', encajada);
      if(encajada) bien++;
    });
    el.encajadas.textContent = bien + ' / ' + (N*N);
    el.movs.textContent = movs;
  }

  function nueva(){
    imagen = pintarCuadro(cuadro);
    barajar();
    movs = 0;
    estado = 'jugando';
    stage.classList.remove('resuelto');
    el.over.classList.remove('show');
    construir();
    clearInterval(cron);
    t0 = Date.now();
    el.tiempo.textContent = '0';
    cron = setInterval(() => {
      if(estado === 'jugando') el.tiempo.textContent = Math.floor((Date.now() - t0) / 1000);
    }, 250);
  }

  function comprobar(){
    if(!orden.every((v, i) => v === i)) return;
    estado = 'fin';
    clearInterval(cron);
    stage.classList.add('resuelto');
    window.Hall && Hall.registrar('13-rompecabezas', Number(el.tiempo.textContent), { unidad: 's', menorEsMejor: true, etiqueta: N + '×' + N });
    el.overTitle.textContent = 'ARMADO';
    el.overText.textContent = movs + ' movimientos en ' + el.tiempo.textContent + ' segundos';
    setTimeout(() => el.over.classList.add('show'), 700);
  }

  /* ------------------------------------------------------------
     Arrastre: al agarrar se crea una copia que sigue al puntero,
     ampliada y con sombra, y el hueco de origen queda apagado.
     ------------------------------------------------------------ */
  let mano = null, sombra = null, casillaOrigen = null, casillaDestino = null;

  function crearMano(casilla, x, y){
    const p = tamPieza();

    sombra = document.createElement('div');
    sombra.id = 'sombra';
    sombra.style.width = p + 'px';
    sombra.style.height = p + 'px';
    document.body.appendChild(sombra);

    mano = document.createElement('div');
    mano.id = 'mano';
    mano.style.width = p + 'px';
    mano.style.height = p + 'px';
    estiloPieza(mano, orden[casilla]);
    document.body.appendChild(mano);

    piezas[casilla].classList.add('origen');
    moverMano(x, y);
  }

  function moverMano(x, y){
    if(!mano) return;
    mano.style.left = x + 'px';
    mano.style.top = y + 'px';
    // la sombra cae un poco por debajo y a la derecha, como si hubiera una luz arriba
    sombra.style.left = (x + 7) + 'px';
    sombra.style.top = (y + 16) + 'px';
  }

  function soltarMano(){
    if(mano){ mano.remove(); mano = null; }
    if(sombra){ sombra.remove(); sombra = null; }
    piezas.forEach(p => p.classList.remove('origen', 'destino'));
    casillaOrigen = null;
    casillaDestino = null;
  }

  function casillaBajoPuntero(x, y){
    if(mano) mano.style.display = 'none';
    if(sombra) sombra.style.display = 'none';
    const bajo = document.elementFromPoint(x, y);
    if(mano) mano.style.display = '';
    if(sombra) sombra.style.display = '';
    const pieza = bajo && bajo.closest ? bajo.closest('.pieza') : null;
    return pieza ? +pieza.dataset.casilla : null;
  }

  tablero.addEventListener('pointerdown', e => {
    if(estado !== 'jugando') return;
    const d = e.target.closest('.pieza');
    if(!d) return;
    e.preventDefault();
    casillaOrigen = +d.dataset.casilla;
    crearMano(casillaOrigen, e.clientX, e.clientY);
    tablero.setPointerCapture(e.pointerId);
  });

  tablero.addEventListener('pointermove', e => {
    if(casillaOrigen === null) return;
    moverMano(e.clientX, e.clientY);

    const sobre = casillaBajoPuntero(e.clientX, e.clientY);
    if(sobre !== casillaDestino){
      piezas.forEach(p => p.classList.remove('destino'));
      casillaDestino = sobre;
      if(sobre !== null && sobre !== casillaOrigen) piezas[sobre].classList.add('destino');
    }
  });

  function terminarArrastre(e){
    if(casillaOrigen === null) return;
    const destino = casillaBajoPuntero(e.clientX, e.clientY);
    const origen = casillaOrigen;
    soltarMano();

    if(destino === null || destino === origen){ pintarTodo(); return; }

    [orden[origen], orden[destino]] = [orden[destino], orden[origen]];
    movs++;
    pintarTodo();
    comprobar();
  }

  tablero.addEventListener('pointerup', terminarArrastre);
  tablero.addEventListener('pointercancel', () => soltarMano());

  /* ---------------- ver el original ---------------- */
  const verOriginal = document.getElementById('verOriginal');
  const mostrarOriginal = v => original.classList.toggle('show', v);

  verOriginal.addEventListener('pointerdown', () => mostrarOriginal(true));
  verOriginal.addEventListener('pointerup', () => mostrarOriginal(false));
  verOriginal.addEventListener('pointerleave', () => mostrarOriginal(false));

  document.addEventListener('keydown', e => {
    if(e.key === ' '){ e.preventDefault(); mostrarOriginal(true); }
    if(e.key.toLowerCase() === 'r') nueva();
  });
  document.addEventListener('keyup', e => {
    if(e.key === ' ') mostrarOriginal(false);
  });

  /* ---------------- ajustes ---------------- */
  document.getElementById('tamanos').addEventListener('click', e => {
    const b = e.target.closest('button');
    if(!b) return;
    document.querySelectorAll('#tamanos button').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    N = +b.dataset.n;
    nueva();
  });

  document.getElementById('cuadros').addEventListener('click', e => {
    const b = e.target.closest('button');
    if(!b) return;
    document.querySelectorAll('#cuadros button').forEach(o => o.classList.remove('on'));
    b.classList.add('on');
    cuadro = +b.dataset.c;
    nueva();
  });

  el.overBtn.addEventListener('click', () => {
    cuadro = (cuadro + 1) % 3;
    document.querySelectorAll('#cuadros button').forEach(o => o.classList.toggle('on', +o.dataset.c === cuadro));
    nueva();
  });

  nueva();
}

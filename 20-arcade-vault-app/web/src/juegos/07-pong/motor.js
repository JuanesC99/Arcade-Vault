/**
 * Motor de la cabina 07-pong.
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

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  const PALA_W = 12, PALA_H = 84, PALA_VEL = 460;
  const META = 7;

  const izq = { x:26,           y:H/2 - PALA_H/2, w:PALA_W, h:PALA_H, vel:0 };
  const der = { x:W - 26 - PALA_W, y:H/2 - PALA_H/2, w:PALA_W, h:PALA_H, vel:0 };
  const bola = { x:W/2, y:H/2, r:8, vx:0, vy:0 };

  let p1 = 0, p2 = 0, rally = 0, mejorRally = 0;
  let estado = 'menu', dosJugadores = false, destellos = [];

  const teclas = {};
  const el = {
    p1: document.getElementById('p1'),
    p2: document.getElementById('p2'),
    rally: document.getElementById('rally'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function sacar(haciaIzquierda){
    bola.x = W/2; bola.y = H/2;
    const ang = (Math.random() * 0.7 - 0.35);
    const vel = 340;
    bola.vx = (haciaIzquierda ? -1 : 1) * vel * Math.cos(ang);
    bola.vy = vel * Math.sin(ang);
    rally = 0;
  }

  function arrancar(){
    p1 = 0; p2 = 0; mejorRally = 0;
    izq.y = der.y = H/2 - PALA_H/2;
    estado = 'jugando';
    el.over.classList.remove('show');
    sacar(Math.random() < 0.5);
    pintarHud();
  }

  function pintarHud(){
    el.p1.textContent = p1;
    el.p2.textContent = p2;
    el.rally.textContent = mejorRally;
  }

  function punto(paraP1){
    if(paraP1) p1++; else p2++;
    mejorRally = Math.max(mejorRally, rally);
    destellos.push({ x: paraP1 ? W - 30 : 30, y: bola.y, t: 0 });
    pintarHud();

    if(p1 >= META || p2 >= META){
      estado = 'fin';
      el.overTitle.textContent = p1 >= META ? 'GANASTE' : 'PERDISTE';
      el.overText.textContent = p1 + ' a ' + p2 + ' · peloteo más largo de ' + mejorRally + ' golpes';
      el.overBtn.textContent = 'OTRA PARTIDA';
      el.over.classList.add('show');
      window.Hall && Hall.registrar('07-pong', mejorRally, { unidad: 'golpes', etiqueta: p1 + '-' + p2 });
      return;
    }
    sacar(paraP1);
  }

  function chocaPala(p){
    return bola.x + bola.r > p.x && bola.x - bola.r < p.x + p.w &&
           bola.y + bola.r > p.y && bola.y - bola.r < p.y + p.h;
  }

  function rebotar(p, haciaDerecha){
    const centro = p.y + p.h / 2;
    const rel = (bola.y - centro) / (p.h / 2);        // -1 arriba, 1 abajo
    const ang = rel * (Math.PI / 3.4);                 // hasta ~53 grados
    const vel = Math.min(760, Math.hypot(bola.vx, bola.vy) * 1.055);
    bola.vx = (haciaDerecha ? 1 : -1) * vel * Math.cos(ang);
    bola.vy = vel * Math.sin(ang);
    bola.x = haciaDerecha ? p.x + p.w + bola.r : p.x - bola.r;
    rally++;
  }

  function actualizar(dt){
    // pala izquierda por teclado
    if(teclas.arrowup)   izq.y -= PALA_VEL * dt;
    if(teclas.arrowdown) izq.y += PALA_VEL * dt;

    // pala derecha
    if(dosJugadores){
      if(teclas.w) der.y -= PALA_VEL * dt;
      if(teclas.s) der.y += PALA_VEL * dt;
    } else {
      // la máquina sigue la bola con retraso, así se le puede ganar
      const objetivo = bola.vx > 0 ? bola.y - der.h / 2 : H/2 - der.h/2;
      const dif = objetivo - der.y;
      const maxVel = 300 + Math.min(140, (p2 - p1) * -30);
      der.y += Math.max(-maxVel * dt, Math.min(maxVel * dt, dif));
    }

    izq.y = Math.max(0, Math.min(H - PALA_H, izq.y));
    der.y = Math.max(0, Math.min(H - PALA_H, der.y));

    bola.x += bola.vx * dt;
    bola.y += bola.vy * dt;

    if(bola.y - bola.r < 0){ bola.y = bola.r; bola.vy = Math.abs(bola.vy); }
    if(bola.y + bola.r > H){ bola.y = H - bola.r; bola.vy = -Math.abs(bola.vy); }

    if(bola.vx < 0 && chocaPala(izq)) rebotar(izq, true);
    if(bola.vx > 0 && chocaPala(der)) rebotar(der, false);

    if(bola.x + bola.r < 0) punto(false);
    if(bola.x - bola.r > W) punto(true);

    destellos.forEach(d => d.t += dt);
    destellos = destellos.filter(d => d.t < .5);
  }

  function dibujar(){
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, W, H);

    // red central
    ctx.strokeStyle = 'rgba(139,131,180,.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 14]);
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.setLineDash([]);

    // marcador de fondo
    ctx.font = 'bold 110px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(46,42,74,.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p1, W/2 - 120, 96);
    ctx.fillText(p2, W/2 + 120, 96);

    destellos.forEach(d => {
      ctx.globalAlpha = 1 - d.t / .5;
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(d.x - 6, 0, 12, H);
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = '#35f0d0';
    ctx.shadowColor = '#35f0d0'; ctx.shadowBlur = 16;
    ctx.fillRect(izq.x, izq.y, izq.w, izq.h);

    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor = '#ff2e88';
    ctx.fillRect(der.x, der.y, der.w, der.h);

    ctx.fillStyle = '#ffe9a8';
    ctx.shadowColor = '#ffb020';
    ctx.beginPath();
    ctx.arc(bola.x, bola.y, bola.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  cv.addEventListener('mousemove', e => {
    if(estado !== 'jugando') return;
    const r = cv.getBoundingClientRect();
    const y = (e.clientY - r.top) * (H / r.height);
    izq.y = Math.max(0, Math.min(H - PALA_H, y - PALA_H / 2));
  });

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    teclas[k] = true;
    if(['arrowup','arrowdown'].includes(k)) e.preventDefault();
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

  document.getElementById('m1').addEventListener('click', () => {
    dosJugadores = false;
    document.getElementById('m1').classList.add('on');
    document.getElementById('m2').classList.remove('on');
  });
  document.getElementById('m2').addEventListener('click', () => {
    dosJugadores = true;
    document.getElementById('m2').classList.add('on');
    document.getElementById('m1').classList.remove('on');
  });

  el.overBtn.addEventListener('click', arrancar);

  let ultimo = performance.now();
  function bucle(t){
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    if(estado === 'jugando') actualizar(dt);
    dibujar();
    requestAnimationFrame(bucle);
  }

  pintarHud();
  requestAnimationFrame(bucle);
}

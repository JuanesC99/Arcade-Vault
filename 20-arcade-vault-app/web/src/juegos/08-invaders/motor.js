/**
 * Motor de la cabina 08-invaders.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { cruceta:'horizontal', acciones: [{ k:' ', txt:'FUEGO' }, { k:'p', txt:'PAUSA' }] };

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

  const NAVE_W = 44, NAVE_H = 16, NAVE_VEL = 340;
  const FILAS = 4, COLS = 9, MARC_W = 32, MARC_H = 22;
  const COLORES = ['#ff2e88', '#ffb020', '#35f0d0', '#7ce85c'];

  let nave, marcianos, balas, bombas, bunkers, teclas = {};
  let score, wave, lives, dirMarc, bajando, estado, disparoCd, ritmo, animT;

  const el = {
    score: document.getElementById('score'),
    wave: document.getElementById('wave'),
    lives: document.getElementById('lives'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function crearMarcianos(){
    const lista = [];
    const ox = (W - COLS * (MARC_W + 14)) / 2;
    for(let f = 0; f < FILAS; f++)
      for(let c = 0; c < COLS; c++)
        lista.push({
          x: ox + c * (MARC_W + 14),
          y: 70 + f * (MARC_H + 16),
          w: MARC_W, h: MARC_H,
          color: COLORES[f],
          puntos: (FILAS - f) * 10,
          vivo: true,
        });
    return lista;
  }

  function crearBunkers(){
    const lista = [];
    for(let i = 0; i < 4; i++)
      lista.push({ x: 70 + i * 145, y: H - 128, w: 62, h: 26, vida: 6 });
    return lista;
  }

  function nuevaOleada(){
    marcianos = crearMarcianos();
    balas = [];
    bombas = [];
    dirMarc = 1;
    bajando = false;
    ritmo = Math.max(0.28, 0.9 - (wave - 1) * 0.1);
    animT = 0;
  }

  function arrancar(){
    nave = { x: W/2 - NAVE_W/2, y: H - 46 };
    score = 0; wave = 1; lives = 3;
    disparoCd = 0;
    bunkers = crearBunkers();
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

  function terminar(gano){
    estado = 'fin';
    window.Hall && Hall.registrar('08-invaders', score, { unidad: 'pts', etiqueta: 'oleada ' + wave });
    el.overTitle.textContent = gano ? 'PLANETA A SALVO' : 'GAME OVER';
    el.overText.textContent = score + ' puntos · oleada ' + wave;
    el.overBtn.textContent = 'OTRA PARTIDA';
    el.over.classList.add('show');
  }

  function chocan(a, b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function actualizar(dt){
    animT += dt;

    if(teclas.arrowleft)  nave.x -= NAVE_VEL * dt;
    if(teclas.arrowright) nave.x += NAVE_VEL * dt;
    nave.x = Math.max(0, Math.min(W - NAVE_W, nave.x));

    disparoCd -= dt;
    if(teclas[' '] && disparoCd <= 0){
      balas.push({ x: nave.x + NAVE_W/2 - 2, y: nave.y - 12, w: 4, h: 12 });
      disparoCd = 0.34;
    }

    // los marcianos avanzan a saltos: cuanto menos quedan, más rápido
    const vivos = marcianos.filter(m => m.vivo);
    const paso = ritmo * (vivos.length / (FILAS * COLS)) * 0.8 + 0.08;
    if(animT >= paso){
      animT = 0;
      let toca = false;
      for(const m of vivos){
        m.x += dirMarc * 14;
        if(m.x < 6 || m.x + m.w > W - 6) toca = true;
      }
      if(toca){
        dirMarc *= -1;
        for(const m of vivos){ m.x += dirMarc * 14; m.y += 18; }
      }
      // alguno dispara
      if(vivos.length && Math.random() < 0.55){
        const t = vivos[Math.floor(Math.random() * vivos.length)];
        bombas.push({ x: t.x + t.w/2 - 2, y: t.y + t.h, w: 4, h: 12 });
      }
    }

    for(const b of balas) b.y -= 620 * dt;
    for(const b of bombas) b.y += (220 + wave * 18) * dt;

    // impactos de nuestras balas
    balas = balas.filter(b => {
      if(b.y + b.h < 0) return false;
      for(const m of marcianos){
        if(m.vivo && chocan(b, m)){
          m.vivo = false;
          score += m.puntos;
          pintarHud();
          return false;
        }
      }
      for(const k of bunkers){
        if(k.vida > 0 && chocan(b, k)){ k.vida--; return false; }
      }
      return true;
    });

    // impactos de las bombas
    bombas = bombas.filter(b => {
      if(b.y > H) return false;
      for(const k of bunkers){
        if(k.vida > 0 && chocan(b, k)){ k.vida--; return false; }
      }
      if(chocan(b, { x:nave.x, y:nave.y, w:NAVE_W, h:NAVE_H })){
        lives--;
        pintarHud();
        if(lives <= 0) terminar(false);
        return false;
      }
      return true;
    });

    // ¿llegaron abajo?
    if(marcianos.some(m => m.vivo && m.y + m.h >= nave.y - 4)) return terminar(false);

    // oleada limpia
    if(!marcianos.some(m => m.vivo)){
      wave++;
      if(wave > 5) return terminar(true);
      score += 100;
      nuevaOleada();
      pintarHud();
    }
  }

  function dibujarMarciano(m, abre){
    ctx.fillStyle = m.color;
    const u = m.w / 8;
    const filas = abre
      ? ['..XX..','.XXXX.','XXXXXX','X.XX.X','XXXXXX','X.X..X']
      : ['..XX..','.XXXX.','XXXXXX','X.XX.X','XXXXXX','..X.X.'];
    filas.forEach((fila, fy) => {
      [...fila].forEach((c, fx) => {
        if(c === 'X') ctx.fillRect(m.x + fx * u * 1.33, m.y + fy * (m.h/6), u * 1.3, m.h/6);
      });
    });
  }

  function dibujar(){
    ctx.fillStyle = '#05040c';
    ctx.fillRect(0, 0, W, H);

    // estrellas fijas
    ctx.fillStyle = 'rgba(233,229,255,.22)';
    for(let i = 0; i < 60; i++){
      const x = (i * 137) % W, y = (i * 219) % (H - 120);
      ctx.fillRect(x, y, 2, 2);
    }

    const abre = Math.floor(performance.now() / 380) % 2 === 0;
    for(const m of marcianos) if(m.vivo) dibujarMarciano(m, abre);

    for(const k of bunkers){
      if(k.vida <= 0) continue;
      ctx.fillStyle = `rgba(53,240,208,${0.25 + k.vida / 8})`;
      ctx.fillRect(k.x, k.y, k.w, k.h);
      ctx.fillStyle = '#05040c';
      ctx.fillRect(k.x + k.w/2 - 9, k.y + k.h - 10, 18, 10);
    }

    ctx.fillStyle = '#ffe9a8';
    for(const b of balas) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#ff5a5a';
    for(const b of bombas) ctx.fillRect(b.x, b.y, b.w, b.h);

    // nave
    ctx.fillStyle = '#35f0d0';
    ctx.shadowColor = '#35f0d0'; ctx.shadowBlur = 12;
    ctx.fillRect(nave.x, nave.y + 8, NAVE_W, 8);
    ctx.fillRect(nave.x + NAVE_W/2 - 12, nave.y + 3, 24, 6);
    ctx.fillRect(nave.x + NAVE_W/2 - 3, nave.y - 3, 6, 8);
    ctx.shadowBlur = 0;

    // suelo
    ctx.fillStyle = 'rgba(255,46,136,.5)';
    ctx.fillRect(0, H - 24, W, 2);
  }

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    teclas[k] = true;
    if(['arrowleft','arrowright',' '].includes(k)) e.preventDefault();
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

  nave = { x: W/2 - NAVE_W/2, y: H - 46 };
  score = 0; wave = 1; lives = 3; disparoCd = 0;
  bunkers = crearBunkers();
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

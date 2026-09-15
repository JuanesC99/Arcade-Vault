/**
 * Motor de la cabina 10-simon.
 *
 * Es el mismo JavaScript que corría en la página suelta, sin reescribir.
 * Lo único nuevo es la envoltura: al desestructurar el entorno, los
 * nombres de abajo tapan a los globales, de modo que cada escucha, cada
 * reloj y cada cuadro de animación quedan apuntados y se pueden deshacer
 * cuando React desmonta la cabina.
 *
 * Generado por herramientas/convertir-cabinas.mjs
 */

export const MANDO = { };

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

  const TECLAS = [...document.querySelectorAll('.tecla')];
  const NOTAS = [329.63, 392.00, 493.88, 587.33];
  const LETRAS = ['q', 'w', 'a', 's'];

  let secuencia = [], paso = 0, ronda = 0, best = 0, estado = 'menu', audio = null;

  const el = {
    ronda: document.getElementById('ronda'),
    fase: document.getElementById('fase'),
    rondaLat: document.getElementById('rondaLat'),
    best: document.getElementById('best'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overText: document.getElementById('overText'),
    overBtn: document.getElementById('overBtn'),
  };

  function tono(i, dur = 0.26){
    try{
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gan = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = NOTAS[i];
      gan.gain.setValueAtTime(0.0001, audio.currentTime);
      gan.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + 0.02);
      gan.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      osc.connect(gan).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    }catch(e){ /* sin audio disponible, el juego sigue */ }
  }

  const esperar = ms => new Promise(r => setTimeout(r, ms));

  async function encender(i, ms){
    TECLAS[i].classList.add('viva');
    tono(i, ms / 1000);
    await esperar(ms);
    TECLAS[i].classList.remove('viva');
    await esperar(Math.max(70, ms * 0.35));
  }

  function pintarHud(){
    el.ronda.textContent = ronda;
    el.rondaLat.textContent = ronda;
    el.best.textContent = best;
  }

  async function siguienteRonda(){
    ronda++;
    secuencia.push(Math.floor(Math.random() * 4));
    paso = 0;
    pintarHud();
    el.fase.textContent = 'Mira';
    estado = 'mostrando';
    await esperar(560);
    const ms = Math.max(180, 520 - ronda * 22);
    for(const i of secuencia){
      if(estado !== 'mostrando') return;
      await encender(i, ms);
    }
    estado = 'tu turno';
    el.fase.textContent = 'Repite';
  }

  function fallar(){
    estado = 'fin';
    best = Math.max(best, ronda - 1);
    window.Hall && Hall.registrar('10-simon', ronda - 1, { unidad: 'rondas' });
    el.fase.textContent = 'Fallo';
    el.overTitle.textContent = 'SE CORTÓ';
    el.overText.textContent = 'Llegaste a la ronda ' + ronda;
    el.overBtn.textContent = 'OTRA PARTIDA';
    el.over.classList.add('show');
    pintarHud();
  }

  async function pulsar(i){
    if(estado !== 'tu turno') return;
    await encender(i, 170);
    if(secuencia[paso] !== i) return fallar();
    paso++;
    if(paso === secuencia.length){
      estado = 'esperando';
      el.fase.textContent = 'Bien';
      await esperar(360);
      siguienteRonda();
    }
  }

  function arrancar(){
    secuencia = [];
    ronda = 0;
    paso = 0;
    el.over.classList.remove('show');
    pintarHud();
    siguienteRonda();
  }

  TECLAS.forEach(t => t.addEventListener('click', () => pulsar(+t.dataset.i)));

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if(k === 'p'){
      if(estado === 'tu turno' || estado === 'mostrando'){
        estado = 'pausa';
        el.fase.textContent = 'Pausa';
        el.overTitle.textContent = 'PAUSA';
        el.overText.textContent = 'La secuencia se repite al volver';
        el.overBtn.textContent = 'SEGUIR';
        el.over.classList.add('show');
      }
      return;
    }
    const i = LETRAS.indexOf(k);
    if(i >= 0) pulsar(i);
  });

  el.overBtn.addEventListener('click', () => {
    if(estado === 'pausa'){
      // retomamos repitiendo la secuencia actual desde el principio
      el.over.classList.remove('show');
      paso = 0;
      ronda--;
      secuencia.pop();
      siguienteRonda();
    } else {
      arrancar();
    }
  });

  pintarHud();
}

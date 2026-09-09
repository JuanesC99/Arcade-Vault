/* ============================================================
   shop.js — tienda: elegir/comprar personajes y subir de nivel
   los potenciadores gastando el banco de monedas.
   ============================================================ */
'use strict';

const Shop = {
  el: {},
  tab: 'chars',
  from: 'menu',          // pantalla a la que se vuelve al salir

  init() {
    this.el = {
      screen: document.getElementById('screen-shop'),
      bank:   document.getElementById('shop-bank'),
      chars:  document.getElementById('tab-chars'),
      ups:    document.getElementById('tab-ups'),
      tabs:   Array.from(document.querySelectorAll('.tab')),
    };

    for (const t of this.el.tabs) {
      t.addEventListener('click', () => this.showTab(t.dataset.tab));
    }
    document.getElementById('btn-shop').addEventListener('click', () => this.open('menu'));
    document.getElementById('btn-shop2').addEventListener('click', () => this.open('over'));
    document.getElementById('btn-shop-back').addEventListener('click', () => this.close());

    // Delegación de eventos: los botones se regeneran en cada dibujado.
    this.el.chars.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-char]');
      if (btn) this.onChar(btn.dataset.char);
    });
    this.el.ups.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-up]');
      if (btn) this.onUpgrade(btn.dataset.up);
    });
  },

  open(from) {
    this.from = from || 'menu';
    Sound.init();
    Game.el.start.classList.add('hidden');
    Game.el.over.classList.add('hidden');
    this.render();
    this.el.screen.classList.remove('hidden');
  },

  close() {
    this.el.screen.classList.add('hidden');
    if (this.from === 'over') Game.el.over.classList.remove('hidden');
    else Game.toMenu();
  },

  showTab(name) {
    this.tab = name;
    for (const t of this.el.tabs) t.classList.toggle('active', t.dataset.tab === name);
    this.el.chars.classList.toggle('hidden', name !== 'chars');
    this.el.ups.classList.toggle('hidden', name !== 'ups');
  },

  // ----------------------- interacción ----------------------

  onChar(id) {
    if (Store.owns(id)) {
      if (Store.data.selected !== id) { Store.select(id); Sound.lane(); }
    } else if (Store.buyChar(id)) {
      Sound.power();
    } else {
      Sound.tone({ freq: 200, to: 120, type: 'square', dur: 0.18, vol: 0.14 });
    }
    this.render();
  },

  onUpgrade(key) {
    if (Store.buyUpgrade(key)) Sound.power();
    else Sound.tone({ freq: 200, to: 120, type: 'square', dur: 0.18, vol: 0.14 });
    this.render();
  },

  // ------------------------- dibujado -----------------------

  render() {
    this.el.bank.textContent = U.fmt(Store.data.bank);
    this.renderChars();
    this.renderUps();
  },

  renderChars() {
    const bank = Store.data.bank;
    const html = Store.CHARS.map((ch) => {
      const owned = Store.owns(ch.id);
      const active = Store.data.selected === ch.id;
      const afford = bank >= ch.price;

      let btn;
      if (active)      btn = `<button class="card-btn on" data-char="${ch.id}">EN USO</button>`;
      else if (owned)  btn = `<button class="card-btn" data-char="${ch.id}">USAR</button>`;
      else if (afford) btn = `<button class="card-btn" data-char="${ch.id}">${U.fmt(ch.price)} 🪙</button>`;
      else             btn = `<button class="card-btn ghost" data-char="${ch.id}" disabled>${U.fmt(ch.price)} 🪙</button>`;

      return `
        <div class="card ${active ? 'selected' : ''} ${owned ? '' : 'locked'}">
          ${!owned && afford ? '<span class="tag-new">¡YA!</span>' : ''}
          ${this.avatar(ch)}
          <div class="cname">${ch.name}</div>
          <div class="ctag">${ch.tag}</div>
          <div class="cperk">${ch.perkText}</div>
          ${btn}
        </div>`;
    }).join('');
    this.el.chars.innerHTML = `<div class="chars">${html}</div>`;
  },

  renderUps() {
    const bank = Store.data.bank;
    const rows = Object.keys(Store.UPGRADES).map((key) => {
      const u = Store.UPGRADES[key];
      const lv = Store.level(key);
      const cost = Store.upgradeCost(key);
      const now = (u.base + u.step * (lv - 1)).toFixed(1);
      const next = cost === null ? null : (u.base + u.step * lv).toFixed(1);

      const dots = Array.from({ length: u.max },
        (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');

      const btn = cost === null
        ? '<button class="up-btn maxed" disabled>MÁXIMO</button>'
        : `<button class="up-btn" data-up="${key}" ${bank >= cost ? '' : 'disabled'}>${U.fmt(cost)} 🪙</button>`;

      const dur = next
        ? `${now} s → <em>${next} s</em>`
        : `${now} s`;

      return `
        <div class="up-row" style="--c:${u.color}">
          <span class="up-ico">${u.icon}</span>
          <div class="up-info">
            <b>${u.name}</b>
            <span>${u.desc}</span>
            <div class="dots">${dots}</div>
          </div>
          <div class="up-buy">
            <span class="up-dur">${dur}</span>
            ${btn}
          </div>
        </div>`;
    }).join('');
    this.el.ups.innerHTML = `<div class="ups">${rows}</div>`;
  },

  /** Miniatura SVG del personaje construida a partir de su paleta. */
  avatar(ch) {
    const p = ch.pal;
    const st = ch.style;

    const hair = st === 'ponytail'
      ? `<ellipse cx="24" cy="25" rx="4.2" ry="9" fill="${p.cap}"/>` : '';
    const hood = st === 'hood'
      ? `<circle cx="24" cy="20" r="10.6" fill="${p.cap}"/>` : '';

    let hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
               <ellipse cx="24" cy="19.4" rx="10" ry="2.5" fill="${p.cap}"/>`;
    if (st === 'beanie') {
      hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
             <rect x="16" y="18.4" width="16" height="3.2" rx="1.4" fill="${p.cap}"/>
             <circle cx="24" cy="10.4" r="3" fill="${p.cap}"/>`;
    } else if (st === 'hood' || st === 'ponytail') {
      hat = `<path d="M16 19.5a8 8 0 0 1 16 0z" fill="${p.cap}"/>`;
    } else if (st === 'halo') {
      hat = `<path d="M16.5 19.5a7.5 7.5 0 0 1 15 0z" fill="${p.cap}"/>
             <ellipse cx="24" cy="8" rx="7" ry="2.2" fill="none"
                      stroke="rgba(255,240,160,.95)" stroke-width="2"/>`;
    }

    return `
      <svg class="avatar" viewBox="0 0 48 64" aria-hidden="true">
        <defs>
          <linearGradient id="g-${ch.id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${p.cloth2}"/>
            <stop offset="1" stop-color="${p.cloth}"/>
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="61" rx="13" ry="2.6" fill="rgba(0,0,0,.35)"/>
        <rect x="18.5" y="43" width="5" height="15" rx="2.5" fill="${p.pants}"/>
        <rect x="24.5" y="43" width="5" height="15" rx="2.5" fill="${p.pants}"/>
        <ellipse cx="19.5" cy="58.5" rx="4.6" ry="2.6" fill="${p.shoe}"/>
        <ellipse cx="28.5" cy="58.5" rx="4.6" ry="2.6" fill="${p.shoe}"/>
        <ellipse cx="24" cy="36" rx="10.5" ry="8.5" fill="${p.pack2}"/>
        <ellipse cx="24" cy="35" rx="8.8" ry="6.8" fill="${p.pack}"/>
        <path d="M16 44 L15 28 H33 L32 44 Z" fill="url(#g-${ch.id})"/>
        <path d="M19 30 L12.5 42" stroke="${p.cloth}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M29 30 L35.5 42" stroke="${p.cloth}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="12.5" cy="42" r="2.6" fill="${p.skin}"/>
        <circle cx="35.5" cy="42" r="2.6" fill="${p.skin}"/>
        ${hair}${hood}
        <circle cx="24" cy="20" r="7.5" fill="${p.skin}"/>
        ${hat}
      </svg>`;
  },
};

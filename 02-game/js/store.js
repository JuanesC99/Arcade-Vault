/* ============================================================
   store.js — progreso persistente: banco de monedas, personajes
   desbloqueables y niveles de mejora de los potenciadores.
   ============================================================ */
'use strict';

const Store = {
  KEY: 'metrorush.save',

  data: {
    best: 0,
    bank: 0,                                  // monedas acumuladas entre partidas
    owned: ['nico'],
    selected: 'nico',
    up: { magnet: 1, shield: 1, boost: 1, jet: 1, boots: 1 },
  },

  // ---------------------- personajes ------------------------
  /**
   * style define la silueta de la cabeza: cap | ponytail | hood | beanie | halo
   * perk aplica un pequeño bonus (multiplicadores sobre 1).
   */
  CHARS: [
    {
      id: 'nico', name: 'Nico', price: 0,
      tag: 'El corredor de siempre', perkText: 'Equilibrado',
      style: 'cap', perk: {},
      pal: { skin: '#e8b48c', cloth: '#2fbfd6', cloth2: '#5ce0f2', pants: '#26304d',
             shoe: '#ff5a5f', cap: '#ff5a5f', pack: '#ffcf3d', pack2: '#e0a91d' },
    },
    {
      id: 'lia', name: 'Lía', price: 250,
      tag: 'Patinadora del subte', perkText: 'Imán +30 % de duración',
      style: 'ponytail', perk: { magnet: 1.3 },
      pal: { skin: '#f0c4a0', cloth: '#ef4f8f', cloth2: '#ff7fb2', pants: '#2b2340',
             shoe: '#ffe27a', cap: '#8b3ea0', pack: '#4bd8ff', pack2: '#2fa8cc' },
    },
    {
      id: 'bruno', name: 'Bruno', price: 600,
      tag: 'Mecánico de vías', perkText: 'Escudo +30 % de duración',
      style: 'beanie', perk: { shield: 1.3 },
      pal: { skin: '#c98a5e', cloth: '#4bbd6a', cloth2: '#79e394', pants: '#3a2f22',
             shoe: '#f0b429', cap: '#e2612f', pack: '#d9dee8', pack2: '#a9b2c4' },
    },
    {
      id: 'kenji', name: 'Kenji', price: 1200,
      tag: 'Sombra nocturna', perkText: 'Salto un 8 % más alto',
      style: 'hood', perk: { jump: 1.08 },
      pal: { skin: '#e2b18b', cloth: '#6b46d6', cloth2: '#9a7cf5', pants: '#171a2b',
             shoe: '#4bd8ff', cap: '#3d2b7a', pack: '#ff5a5f', pack2: '#c93b45' },
    },
    {
      id: 'aura', name: 'Aura', price: 2500,
      tag: 'Leyenda del andén', perkText: '+12 % de puntuación',
      style: 'halo', perk: { score: 1.12 },
      pal: { skin: '#f4d3b0', cloth: '#e8b923', cloth2: '#ffe27a', pants: '#4a3a12',
             shoe: '#ffffff', cap: '#fff2b8', pack: '#8b6cff', pack2: '#6a4fd6' },
    },
  ],

  // -------------------- mejoras (tienda) --------------------
  UPGRADES: {
    magnet: { name: 'Imán',            icon: '🧲', color: '#a86bff', base: 8.0, step: 1.4, max: 5,
              desc: 'Atrae las monedas cercanas' },
    shield: { name: 'Escudo',          icon: '🛡',  color: '#4bd8ff', base: 9.0, step: 1.4, max: 5,
              desc: 'Aguanta un golpe sin caer' },
    boost:  { name: 'Puntos x2',       icon: '★',  color: '#45e08a', base: 8.0, step: 1.4, max: 5,
              desc: 'Duplica todo lo que puntúas' },
    jet:    { name: 'Jetpack',         icon: '🚀', color: '#ff8a3d', base: 4.0, step: 0.7, max: 5,
              desc: 'Vuelas por encima de todo' },
    boots:  { name: 'Súper zapatillas',icon: '👟', color: '#ff5ac8', base: 7.0, step: 1.3, max: 5,
              desc: 'Saltos mucho más altos' },
  },

  // ------------------------ persistencia --------------------
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.data.best = Number(d.best) || 0;
        this.data.bank = Number(d.bank) || 0;
        this.data.owned = Array.isArray(d.owned) && d.owned.length ? d.owned : ['nico'];
        if (!this.data.owned.includes('nico')) this.data.owned.push('nico');
        this.data.selected = this.data.owned.includes(d.selected) ? d.selected : 'nico';
        for (const k of Object.keys(this.data.up)) {
          const v = Math.round(Number(d.up && d.up[k]) || 1);
          this.data.up[k] = U.clamp(v, 1, this.UPGRADES[k].max);
        }
      } else {
        // Compatibilidad con la primera versión, que solo guardaba el récord.
        this.data.best = Number(localStorage.getItem('metrorush.best') || 0) || 0;
      }
    } catch (e) { /* almacenamiento no disponible */ }
    return this.data;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ignorar */ }
  },

  // -------------------------- consultas ---------------------
  char(id) { return this.CHARS.find((c) => c.id === (id || this.data.selected)) || this.CHARS[0]; },
  owns(id) { return this.data.owned.includes(id); },

  /** Multiplicador del perk del personaje activo (1 si no aplica). */
  perk(key) { return this.char().perk[key] || 1; },

  level(key) { return this.data.up[key] || 1; },

  /** Duración efectiva de un potenciador: nivel + perk del personaje. */
  duration(key) {
    const u = this.UPGRADES[key];
    if (!u) return 0;
    return (u.base + u.step * (this.level(key) - 1)) * this.perk(key);
  },

  /** Coste de subir un potenciador al siguiente nivel (null si está al máximo). */
  upgradeCost(key) {
    const u = this.UPGRADES[key];
    const lv = this.level(key);
    if (lv >= u.max) return null;
    return Math.round(120 * Math.pow(lv, 1.45));
  },

  // -------------------------- compras -----------------------
  buyChar(id) {
    const ch = this.char(id);
    if (!ch || this.owns(id) || this.data.bank < ch.price) return false;
    this.data.bank -= ch.price;
    this.data.owned.push(id);
    this.data.selected = id;
    this.save();
    return true;
  },

  select(id) {
    if (!this.owns(id)) return false;
    this.data.selected = id;
    this.save();
    return true;
  },

  buyUpgrade(key) {
    const cost = this.upgradeCost(key);
    if (cost === null || this.data.bank < cost) return false;
    this.data.bank -= cost;
    this.data.up[key]++;
    this.save();
    return true;
  },

  addCoins(n) { this.data.bank += n; this.save(); },

  setBest(v) {
    if (v <= this.data.best) return false;
    this.data.best = Math.floor(v);
    this.save();
    return true;
  },
};

/* ============================================================
   salon.js — marcador compartido del Arcade Vault.

   Lo cargan las cabinas para dejar su resultado y lo lee la tienda
   para pintar el Hall of Fame. Todo vive en localStorage, que en
   Chrome se comparte entre todas las páginas file:// del equipo.

   Uso desde un juego:
     <script src="../04-arcade-vault/salon.js"></script>
     ...
     window.Hall && Hall.registrar('06-snake', score, { unidad: 'pts' });

   Si el archivo no carga, `window.Hall` no existe y el juego sigue
   funcionando igual: por eso todas las llamadas van con guarda.
   ============================================================ */
(function () {
  'use strict';

  var CLAVE = 'arcadeVault:hof:v1';
  var CLAVE_NOMBRE = 'arcadeVault:jugador';
  var TOPE = 5;               // marcas guardadas por juego

  function leerBruto() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function guardar(datos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      return false;
    }
  }

  var Hall = {
    /* Nombre con el que se firman las marcas. Manda la sesión abierta:
       si alguien entró con su cuenta, sus marcas van con su alias. */
    jugador: function () {
      try {
        var alias = window.Cuentas && Cuentas.alias();
        if (alias) return alias;
      } catch (e) {}
      try {
        return localStorage.getItem(CLAVE_NOMBRE) || 'JUGADOR';
      } catch (e) {
        return 'JUGADOR';
      }
    },

    ponerJugador: function (nombre) {
      var limpio = String(nombre || '').trim().slice(0, 12).toUpperCase() || 'JUGADOR';
      try {
        if (window.Cuentas && Cuentas.actual()) return Cuentas.ponerAlias(limpio) || limpio;
      } catch (e) {}
      try { localStorage.setItem(CLAVE_NOMBRE, limpio); } catch (e) {}
      return limpio;
    },

    /* Todas las marcas, ya ordenadas. */
    leer: function () {
      return leerBruto();
    },

    marcas: function (juego) {
      var d = leerBruto();
      return (d[juego] && d[juego].marcas) || [];
    },

    /* La mejor marca de un juego, o null si aún no hay ninguna. */
    mejor: function (juego) {
      return this.marcas(juego)[0] || null;
    },

    /**
     * Guarda un resultado y devuelve la posición (1 = mejor) o 0 si no entró.
     *
     * juego    id de la cabina, normalmente el nombre de su carpeta
     * valor    número a comparar
     * opciones { menorEsMejor, unidad, etiqueta }
     */
    registrar: function (juego, valor, opciones) {
      opciones = opciones || {};
      valor = Number(valor);
      if (!juego || !isFinite(valor)) return 0;

      var datos = leerBruto();
      var ficha = datos[juego] || { menorEsMejor: !!opciones.menorEsMejor, unidad: opciones.unidad || '', marcas: [] };

      ficha.menorEsMejor = !!opciones.menorEsMejor;
      if (opciones.unidad) ficha.unidad = opciones.unidad;

      ficha.marcas.push({
        n: this.jugador(),
        v: valor,
        e: opciones.etiqueta || '',
        f: new Date().toISOString().slice(0, 10)
      });

      ficha.marcas.sort(function (a, b) {
        return ficha.menorEsMejor ? a.v - b.v : b.v - a.v;
      });
      ficha.marcas = ficha.marcas.slice(0, TOPE);

      datos[juego] = ficha;
      if (!guardar(datos)) return 0;

      // posición de la marca recién metida (la primera que coincide en valor y nombre)
      var yo = this.jugador();
      for (var i = 0; i < ficha.marcas.length; i++) {
        if (ficha.marcas[i].v === valor && ficha.marcas[i].n === yo) return i + 1;
      }
      return 0;
    },

    borrar: function () {
      try { localStorage.removeItem(CLAVE); } catch (e) {}
    },

    /* ¿Se puede guardar en este navegador? La tienda lo usa para avisar. */
    disponible: function () {
      try {
        localStorage.setItem('arcadeVault:prueba', '1');
        localStorage.removeItem('arcadeVault:prueba');
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  window.Hall = Hall;
})();

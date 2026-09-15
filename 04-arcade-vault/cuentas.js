/* ============================================================
   cuentas.js — registro y sesión del Arcade Vault.

   Guarda las cuentas en localStorage y firma las marcas del Hall
   of Fame con el alias de quien esté dentro.

     <script src="../04-arcade-vault/cuentas.js"></script>
     ...
     window.Cuentas && Cuentas.actual();   // null si nadie entró

   AVISO IMPORTANTE
   Esto es un salón que corre en el navegador, sin servidor. La
   contraseña se guarda derivada con PBKDF2 y sal aleatoria, que es
   lo correcto, pero la base entera vive en localStorage: cualquiera
   que abra las herramientas del navegador en este equipo puede ver
   los usuarios y borrarlos. Sirve para separar jugadores en la
   misma máquina, NO para proteger nada de valor. No reutilices aquí
   una contraseña que uses en otro sitio.
   ============================================================ */
(function () {
  'use strict';

  var CLAVE_CUENTAS = 'arcadeVault:cuentas:v1';
  var CLAVE_SESION  = 'arcadeVault:sesion:v1';
  var ITERACIONES   = 120000;

  /* ---------------- almacén ---------------- */

  function leerCuentas() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_CUENTAS) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function guardarCuentas(datos) {
    try {
      localStorage.setItem(CLAVE_CUENTAS, JSON.stringify(datos));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------------- contraseñas ---------------- */

  var subtle = (window.crypto && window.crypto.subtle) || null;

  function bytesAlAzar(n) {
    var b = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(b);
    else for (var i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }

  function aHex(buffer) {
    var v = new Uint8Array(buffer), s = '';
    for (var i = 0; i < v.length; i++) s += ('0' + v[i].toString(16)).slice(-2);
    return s;
  }

  function deHex(hex) {
    var v = new Uint8Array(hex.length / 2);
    for (var i = 0; i < v.length; i++) v[i] = parseInt(hex.substr(i * 2, 2), 16);
    return v;
  }

  /* Reserva para navegadores sin WebCrypto: no es criptografía seria y
     se marca como tal para que la cuenta se migre en cuanto se pueda. */
  function resumenPobre(texto) {
    var h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < texto.length; i++) {
      h1 = (h1 ^ texto.charCodeAt(i)) * 16777619 >>> 0;
      h2 = (h2 + texto.charCodeAt(i) * (i + 7)) * 2654435761 >>> 0;
    }
    return ('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8);
  }

  function derivar(pass, salHex) {
    if (!subtle) {
      return Promise.resolve({ hash: resumenPobre(salHex + '|' + pass), metodo: 'debil' });
    }
    var enc = new TextEncoder();
    return subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits'])
      .then(function (clave) {
        return subtle.deriveBits({
          name: 'PBKDF2',
          salt: deHex(salHex),
          iterations: ITERACIONES,
          hash: 'SHA-256'
        }, clave, 256);
      })
      .then(function (bits) {
        return { hash: aHex(bits), metodo: 'pbkdf2' };
      })
      .catch(function () {
        return { hash: resumenPobre(salHex + '|' + pass), metodo: 'debil' };
      });
  }

  /* Comparación en tiempo constante, por costumbre sana. */
  function igual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var d = 0;
    for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
  }

  /* ---------------- validación ---------------- */

  function normalizarUsuario(u) {
    return String(u || '').trim().toLowerCase();
  }

  function revisarUsuario(u) {
    if (u.length < 3) return 'El usuario necesita al menos 3 caracteres.';
    if (u.length > 16) return 'El usuario no puede pasar de 16 caracteres.';
    if (!/^[a-z0-9_.-]+$/.test(u)) return 'Usa solo letras, números, punto, guion y guion bajo.';
    return null;
  }

  function revisarPass(p) {
    if (String(p || '').length < 6) return 'La contraseña necesita al menos 6 caracteres.';
    if (String(p).length > 72) return 'La contraseña no puede pasar de 72 caracteres.';
    return null;
  }

  function limpiarAlias(alias, usuario) {
    var a = String(alias || '').trim().slice(0, 12).toUpperCase();
    return a || String(usuario || 'JUGADOR').slice(0, 12).toUpperCase();
  }

  /* ---------------- sesión ---------------- */

  function leerSesion() {
    var crudo = null;
    try { crudo = sessionStorage.getItem(CLAVE_SESION); } catch (e) {}
    if (!crudo) {
      try { crudo = localStorage.getItem(CLAVE_SESION); } catch (e) {}
    }
    if (!crudo) return null;
    try {
      var s = JSON.parse(crudo);
      if (!s || !s.usuario) return null;
      // una cuenta borrada no puede seguir con la sesión abierta
      if (!leerCuentas()[s.usuario]) return null;
      return s;
    } catch (e) {
      return null;
    }
  }

  function escribirSesion(sesion, recordar) {
    var texto = JSON.stringify(sesion);
    try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) {}
    try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
    try {
      if (recordar) localStorage.setItem(CLAVE_SESION, texto);
      else sessionStorage.setItem(CLAVE_SESION, texto);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------------- API ---------------- */

  var Cuentas = {

    disponible: function () {
      try {
        localStorage.setItem('arcadeVault:prueba', '1');
        localStorage.removeItem('arcadeVault:prueba');
        return true;
      } catch (e) {
        return false;
      }
    },

    /* true cuando las contraseñas se derivan con WebCrypto de verdad. */
    cifradoFuerte: function () { return !!subtle; },

    cuantas: function () { return Object.keys(leerCuentas()).length; },

    existe: function (usuario) { return !!leerCuentas()[normalizarUsuario(usuario)]; },

    /* La sesión abierta, o null. */
    actual: function () { return leerSesion(); },

    /* Nombre con el que firmar una marca. */
    alias: function () {
      var s = leerSesion();
      return s ? s.alias : null;
    },

    /**
     * Crea una cuenta y deja la sesión abierta.
     * Devuelve una promesa con { ok, error, sesion }.
     */
    registrar: function (usuario, alias, pass, pass2, recordar) {
      var u = normalizarUsuario(usuario);
      var fallo = revisarUsuario(u) || revisarPass(pass);
      if (!fallo && pass !== pass2) fallo = 'Las dos contraseñas no coinciden.';
      if (!fallo && !this.disponible()) fallo = 'Este navegador no deja guardar datos: no se puede crear la cuenta.';
      if (!fallo && leerCuentas()[u]) fallo = 'Ese usuario ya está cogido.';
      if (fallo) return Promise.resolve({ ok: false, error: fallo });

      var sal = aHex(bytesAlAzar(16));
      return derivar(pass, sal).then(function (res) {
        var cuentas = leerCuentas();
        if (cuentas[u]) return { ok: false, error: 'Ese usuario ya está cogido.' };

        cuentas[u] = {
          usuario: u,
          alias: limpiarAlias(alias, u),
          sal: sal,
          hash: res.hash,
          metodo: res.metodo,
          iteraciones: res.metodo === 'pbkdf2' ? ITERACIONES : 0,
          creada: new Date().toISOString(),
          ultimo: new Date().toISOString()
        };
        if (!guardarCuentas(cuentas)) return { ok: false, error: 'No se pudo guardar la cuenta.' };

        var sesion = { usuario: u, alias: cuentas[u].alias, desde: new Date().toISOString() };
        escribirSesion(sesion, recordar);
        return { ok: true, sesion: sesion };
      });
    },

    /**
     * Abre sesión. Devuelve una promesa con { ok, error, sesion }.
     */
    entrar: function (usuario, pass, recordar) {
      var u = normalizarUsuario(usuario);
      if (!u || !pass) return Promise.resolve({ ok: false, error: 'Escribe usuario y contraseña.' });

      var cuentas = leerCuentas();
      var cuenta = cuentas[u];
      // Derivamos igual aunque el usuario no exista, para no delatar cuáles hay.
      var sal = cuenta ? cuenta.sal : aHex(bytesAlAzar(16));

      return derivar(pass, sal).then(function (res) {
        if (!cuenta || !igual(res.hash, cuenta.hash)) {
          return { ok: false, error: 'Usuario o contraseña incorrectos.' };
        }
        cuenta.ultimo = new Date().toISOString();
        cuentas[u] = cuenta;
        guardarCuentas(cuentas);

        var sesion = { usuario: u, alias: cuenta.alias, desde: new Date().toISOString() };
        escribirSesion(sesion, recordar);
        return { ok: true, sesion: sesion };
      });
    },

    salir: function () {
      try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) {}
      try { localStorage.removeItem(CLAVE_SESION); } catch (e) {}
    },

    /* Cambia el alias de la cuenta abierta. Devuelve el alias final. */
    ponerAlias: function (alias) {
      var s = leerSesion();
      if (!s) return null;
      var cuentas = leerCuentas();
      if (!cuentas[s.usuario]) return null;

      var limpio = limpiarAlias(alias, s.usuario);
      cuentas[s.usuario].alias = limpio;
      guardarCuentas(cuentas);

      s.alias = limpio;
      // reescribe la sesión donde ya estaba
      var recordar = false;
      try { recordar = !!localStorage.getItem(CLAVE_SESION); } catch (e) {}
      escribirSesion(s, recordar);
      return limpio;
    },

    /* Cambia la contraseña de la cuenta abierta. Promesa { ok, error }. */
    cambiarPass: function (actual, nueva, nueva2) {
      var s = leerSesion();
      if (!s) return Promise.resolve({ ok: false, error: 'No hay ninguna sesión abierta.' });
      var fallo = revisarPass(nueva);
      if (!fallo && nueva !== nueva2) fallo = 'Las dos contraseñas nuevas no coinciden.';
      if (fallo) return Promise.resolve({ ok: false, error: fallo });

      var cuentas = leerCuentas();
      var cuenta = cuentas[s.usuario];
      if (!cuenta) return Promise.resolve({ ok: false, error: 'La cuenta ya no existe.' });

      return derivar(actual, cuenta.sal).then(function (res) {
        if (!igual(res.hash, cuenta.hash)) return { ok: false, error: 'La contraseña actual no es correcta.' };
        var sal = aHex(bytesAlAzar(16));
        return derivar(nueva, sal).then(function (nuevo) {
          cuenta.sal = sal;
          cuenta.hash = nuevo.hash;
          cuenta.metodo = nuevo.metodo;
          cuenta.iteraciones = nuevo.metodo === 'pbkdf2' ? ITERACIONES : 0;
          cuentas[s.usuario] = cuenta;
          if (!guardarCuentas(cuentas)) return { ok: false, error: 'No se pudo guardar el cambio.' };
          return { ok: true };
        });
      });
    },

    /* Borra la cuenta abierta. Pide la contraseña para confirmar. */
    borrarCuenta: function (pass) {
      var s = leerSesion();
      if (!s) return Promise.resolve({ ok: false, error: 'No hay ninguna sesión abierta.' });
      var cuentas = leerCuentas();
      var cuenta = cuentas[s.usuario];
      if (!cuenta) return Promise.resolve({ ok: false, error: 'La cuenta ya no existe.' });

      return derivar(pass, cuenta.sal).then(function (res) {
        if (!igual(res.hash, cuenta.hash)) return { ok: false, error: 'La contraseña no es correcta.' };
        delete cuentas[s.usuario];
        guardarCuentas(cuentas);
        Cuentas.salir();
        return { ok: true };
      });
    }
  };

  window.Cuentas = Cuentas;
})();

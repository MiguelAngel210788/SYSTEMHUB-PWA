/* Contenedor instalable de SystemHUP: carga la Web App validada en un iframe a pantalla completa.
 * No guarda sesión, datos ni respuestas de la app; solo (en QA) recuerda su dirección en este dispositivo.
 * Sin versión propia: no depende de la versión de HUP. */
(function () {
  'use strict';

  var doc = document, raiz = doc.documentElement;
  var ENTORNO = raiz.getAttribute('data-hup-env') === 'qa' ? 'qa' : 'prod';
  var BASE = raiz.getAttribute('data-hup-base') || './';
  var CFG = window.HUP_PWA_CONFIG || {};
  var VAL = window.HUP_PWA_VALIDAR;
  var LLAVE_QA = 'hup-pwa-qa-backend';
  var LLAVE_CONTINUAR = 'hup-pwa-continuar-' + ENTORNO;
  var pedidoInstalar = null;

  function el(id) { return doc.getElementById(id); }
  function mostrar(id, si) { var e = el(id); if (e) e.hidden = !si; }
  function texto(id, t, esError) {
    var e = el(id);
    if (!e) return;
    e.textContent = t;
    e.classList.toggle('error', !!esError);
  }
  function leer(almacen, llave) { try { return almacen.getItem(llave) || ''; } catch (e) { return ''; } }
  function guardar(almacen, llave, valor) { try { almacen.setItem(llave, valor); } catch (e) { /* opcional */ } }

  function esStandalone() {
    var media = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return Boolean(media || window.navigator.standalone === true);
  }
  function esIos() {
    var ua = window.navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  }

  /* ── Dirección permitida ───────────────────────────────────────────────────────────────────────────────── */
  // Devuelve {url, motivo}. motivo: '' | 'config' | 'rechazado' | 'falta'.
  function resolverUrl() {
    var hashes = CFG.hashesPermitidos || [];
    if (!VAL) return Promise.resolve({ url: '', motivo: 'config' });
    if (ENTORNO === 'prod') {
      return VAL.validar(CFG.prodUrl, hashes).then(function (u) { return { url: u, motivo: u ? '' : 'config' }; });
    }
    var param = new URLSearchParams(window.location.search || '').get('backend');
    if (param !== null) {
      return VAL.validar(param, hashes).then(function (u) {
        if (!u) return { url: '', motivo: 'rechazado' };
        guardar(window.localStorage, LLAVE_QA, u);
        try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { /* opcional */ }
        return { url: u, motivo: '' };
      });
    }
    return VAL.validar(leer(window.localStorage, LLAVE_QA), hashes).then(function (u) {
      return { url: u, motivo: u ? '' : 'falta' };
    });
  }

  /* ── Pantallas ─────────────────────────────────────────────────────────────────────────────────────────── */
  function mostrarSinUrl(motivo) {
    mostrar('inicio', false);
    mostrar('aviso', true);
    var formulario = el('formQa');
    if (motivo === 'falta' && formulario) {
      texto('avisoTexto', 'Abre el enlace de QA que te compartieron o pega aquí la dirección.');
      formulario.hidden = false;
      formulario.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var valor = el('campoQa').value;
        VAL.validar(valor, CFG.hashesPermitidos || []).then(function (u) {
          if (!u) { texto('avisoEstado', 'Esa dirección no está autorizada.', true); return; }
          guardar(window.localStorage, LLAVE_QA, u);
          window.location.replace(window.location.pathname);
        });
      });
      return;
    }
    texto('avisoTexto', motivo === 'rechazado'
      ? 'Este enlace no está autorizado.'
      : 'El contenedor no está configurado. Avisa al administrador del sistema.', true);
  }

  function mostrarInicio() {
    mostrar('inicio', true);
    var ios = esIos();
    mostrar('pasosIos', ios);
    var boton = el('btnInstalar');
    if (boton) { boton.hidden = ios; boton.addEventListener('click', instalar); }
    var seguir = el('btnContinuar');
    if (seguir) seguir.addEventListener('click', function () { guardar(window.sessionStorage, LLAVE_CONTINUAR, '1'); montar(); });
  }

  function montar() {
    if (montar.hecho) return;
    montar.hecho = true;
    resolverUrl().then(function (r) {
      if (!r.url) { montar.hecho = false; mostrarSinUrl(r.motivo); return; }
      mostrar('inicio', false);
      mostrar('aviso', false);
      mostrar('carga', true);
      var marco = el('app'), terminado = false;
      function listo() {
        if (terminado) return;
        terminado = true;
        marco.style.visibility = 'visible';
        mostrar('carga', false);
      }
      marco.addEventListener('load', listo);
      window.setTimeout(function () {
        var enlace = el('enlaceDirecto');
        if (!terminado && enlace) { enlace.href = r.url; enlace.hidden = false; }
      }, 10000);
      window.setTimeout(listo, 20000);
      marco.src = r.url + '?pwa=launch&hup_embed=1';
    });
  }

  /* ── Instalación ───────────────────────────────────────────────────────────────────────────────────────── */
  function instalar() {
    if (!pedidoInstalar) { mostrar('ayudaInstalar', true); return; }
    var p = pedidoInstalar;
    pedidoInstalar = null;
    p.prompt();
    p.userChoice.then(function (r) {
      texto('estado', r && r.outcome === 'accepted' ? 'Listo. Busca HUP en tu pantalla de inicio o en tus aplicaciones.' : '');
    }, function () { /* sin acción */ });
  }

  window.addEventListener('beforeinstallprompt', function (ev) { ev.preventDefault(); pedidoInstalar = ev; });
  window.addEventListener('appinstalled', function () {
    pedidoInstalar = null;
    texto('estado', 'Listo. Busca HUP en tu pantalla de inicio o en tus aplicaciones.');
    mostrar('btnInstalar', false);
  });

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE, updateViaCache: 'none' }).catch(function () { /* opcional */ });
  }

  function iniciar() {
    registrarServiceWorker();
    if (esStandalone() || leer(window.sessionStorage, LLAVE_CONTINUAR) === '1') { montar(); return; }
    resolverUrl().then(function (r) {
      if (!r.url) { mostrarSinUrl(r.motivo); return; }
      mostrarInicio();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

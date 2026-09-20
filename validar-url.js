/* Validación de la dirección de la Web App que el contenedor puede cargar.
 *
 * Solo se acepta https://script.google.com/macros/s/<ID>/exec cuyo <ID> tenga un hash SHA-256 incluido en la
 * lista permitida (config.js). Así nadie puede usar el contenedor público para enmarcar otra aplicación, y el
 * repositorio no revela el ID de QA (un hash no se puede invertir). La dirección final se RECONSTRUYE solo con
 * el ID validado: nunca se usa el texto recibido.
 *
 * Funciona en el navegador (window.HUP_PWA_VALIDAR) y en Node (module.exports) para poder probarlo.
 */
(function (raiz) {
  'use strict';

  var HOST = 'script.google.com';
  var RUTA = /^\/macros\/s\/([A-Za-z0-9_-]{20,200})\/exec\/?$/;

  // Devuelve el ID de implementación si la forma de la dirección es válida; si no, ''.
  function extraerId(valor) {
    var texto = String(valor == null ? '' : valor).trim();
    if (!texto || texto.length > 400 || /[\s"'<>\\]/.test(texto)) return '';
    var url;
    try { url = new URL(texto); } catch (e) { return ''; }
    if (url.protocol !== 'https:') return '';
    if (url.hostname !== HOST) return '';
    if (url.port !== '') return '';
    if (url.username !== '' || url.password !== '') return '';
    var m = RUTA.exec(url.pathname);
    return m ? m[1] : '';
  }

  function aHex(buffer) {
    var bytes = new Uint8Array(buffer), out = '';
    for (var i = 0; i < bytes.length; i++) out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return out;
  }

  // SHA-256 (hex) del texto. En el navegador exige contexto seguro (HTTPS o localhost).
  function sha256(texto) {
    var subtle = (raiz.crypto && raiz.crypto.subtle);
    if (!subtle) return Promise.reject(new Error('Sin WebCrypto'));
    return subtle.digest('SHA-256', new TextEncoder().encode(texto)).then(aHex);
  }

  // Resuelve con la dirección canónica si está permitida; si no, con ''.
  function validar(valor, hashesPermitidos) {
    var id = extraerId(valor);
    if (!id) return Promise.resolve('');
    var lista = Array.isArray(hashesPermitidos) ? hashesPermitidos.map(function (h) { return String(h).toLowerCase(); }) : [];
    return sha256(id).then(function (hash) {
      return lista.indexOf(hash) !== -1 ? 'https://' + HOST + '/macros/s/' + id + '/exec' : '';
    }, function () { return ''; });
  }

  var api = { extraerId: extraerId, sha256: sha256, validar: validar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.HUP_PWA_VALIDAR = api;
})(typeof window !== 'undefined' ? window : globalThis);

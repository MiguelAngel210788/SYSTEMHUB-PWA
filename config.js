/* Configuración pública del contenedor. Se genera con `node pwa/configurar.cjs <URL PROD> <URL QA>`.
 * hashesPermitidos = SHA-256 de los IDs de implementación (PROD y QA); un hash no revela el ID.
 * prodUrl = dirección de PROD, que el contenedor carga sin pedir nada. QA solo entra por enlace o por el campo de QA. */
window.HUP_PWA_CONFIG = Object.freeze({
  prodUrl: 'https://script.google.com/macros/s/AKfycbwJxC01sa0-m_ht3x-d-f8xPjMp0dpFOFD10U-b299f_lDN7m_dALf0b-nQSMHztnKe/exec',
  hashesPermitidos: [
    '7561da7f2d073ffd456b8954efb5c87899c06f0a5c1a6bfd1998ce679f839ca3', // PROD
    'e35a7ced2a0ca5334f637210d4b1a29aaeb57fe89a406c74d3d05bd1cfe59899'  // QA
  ]
});

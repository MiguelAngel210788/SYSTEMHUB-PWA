'use strict';

/* Service worker del contenedor de SystemHUP. Sin versión ni caché: el contenedor nunca guarda la sesión
 * ni respuestas de la app. Solo hace instalable la página y, si no hay red, muestra un aviso en lugar del
 * error del navegador. Las navegaciones van siempre a la red para ver de inmediato cualquier cambio. */

const SIN_CONEXION = '<!doctype html><html lang="es-MX"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title></head>' +
  '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#0F081C;color:#EDE9FE;font:16px system-ui,sans-serif;text-align:center;padding:24px">' +
  '<div><h1 style="font-size:1.3rem">Sin conexión</h1>' +
  '<p style="color:#A79BC8">HUP necesita internet. Revisa tu conexión y vuelve a abrir la aplicación.</p></div></body></html>';

self.addEventListener('install', (event) => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(() => new Response(SIN_CONEXION, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }))
  );
});

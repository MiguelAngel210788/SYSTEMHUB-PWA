# SYSTEMHUB-PWA

Contenedor estático instalable (PWA) de SystemHUP, servido por GitHub Pages. Solo carga, en un `<iframe>` a pantalla completa, la Web App autorizada (PROD por defecto; `/qa/` para pruebas) y permite instalarla como aplicación.

Solo contiene los archivos de distribución del contenedor. No incluye código del sistema, datos, credenciales ni documentación interna. No guarda sesión, tokens ni respuestas de la app, y solo acepta las direcciones de la Web App listadas (por hash) en `config.js`.

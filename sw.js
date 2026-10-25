// Service worker: permite abrir Tareitas sin internet.
const CACHE = 'tareitas-v4';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'confetti.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const putInCache = (request, response) => {
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
  return response;
};

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Tipografía de Google: primero caché (casi nunca cambia)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => putInCache(request, res))));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Archivos de la app: primero internet (así se ven los cambios), caché si no hay conexión
  e.respondWith(
    fetch(request)
      .then((res) => (res.ok ? putInCache(request, res) : res))
      .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))),
  );
});

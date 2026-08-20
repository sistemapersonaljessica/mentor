// Service worker do Mentor · Team Jesga
// Estratégia: network-first para conteúdo (sempre pega a versão mais nova quando online),
// com fallback pro cache quando offline. Assim o app nunca "trava" numa versão antiga.
const CACHE = 'tj-mentor-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          // navegação offline sem match exato: devolve o app shell
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      })
  );
});

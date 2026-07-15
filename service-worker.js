// 非言語サポーターアプリ そよぎ - Service Worker
const CACHE_VERSION = 'v5';
const CACHE_NAME = `nameless-pulse-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        CORE_ASSETS.map((url) => cache.add(url).catch((e) => console.warn('skip cache:', url, e)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

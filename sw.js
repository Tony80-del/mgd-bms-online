/* MGD BMS Mobile · service worker */
const CACHE = 'mgd-bms-mobile-v4-20260919';
const FILES = [
  './mgd-bms-mobile.html',
  './manifest.json',
  './mgd-icon-192.png',
  './mgd-icon-512.png'
];

// Install — pre-cache the app shell
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
});

// Activate — drop old caches, take over
self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});

// Fetch — network-first for the app page (always fresh data), cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isAppPage = /mgd-bms-mobile\.html$/.test(url.pathname);
  if (isAppPage) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
  }
});

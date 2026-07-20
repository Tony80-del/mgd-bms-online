const CACHE = 'mgd-bms-v4f2c5d6';
const FILES = [
  '/mgd-bms-mobile-view.html',
  '/manifest.json',
  '/mgd-icon-192.png',
  '/mgd-icon-512.png'
];

// Install — cache static files
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})
  );
});

// Activate — remove old caches + claim all clients
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
      self.clients.claim()
    ])
  );
});

// Fetch — network-first for HTML (always fresh), cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname === '/mgd-bms-mobile-view.html' || url.pathname === '/') {
    // Network-first for the app page — always try to get latest
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for assets (icons, manifest)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});

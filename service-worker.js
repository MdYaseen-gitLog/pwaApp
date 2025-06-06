const CACHE_NAME = 'pwaApp-cache-v1.6.0';

const STATIC_ASSETS = [
  '/pwaApp/',
  '/pwaApp/index.html',
  '/pwaApp/dashboard.html',
  '/pwaApp/reports.html',
  '/pwaApp/analytics.html',
  '/pwaApp/settings.html',
  '/pwaApp/style.css',
  '/pwaApp/offline.html',
  '/pwaApp/icons/icon-192.png',
  '/pwaApp/icons/icon-512.png',
  '/pwaApp/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url =>
        cache.add(url)
      )).then(results => {
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error('Failed to cache:', STATIC_ASSETS[i]);
          }
        });
      })
    )
  );
});


// Activate - remove old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch - dynamic strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return;
  }

  if (req.headers.get('accept')?.includes('text/html')) {
    // HTML request – network first, fallback to cache, then offline page
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(res => res || caches.match('/pwaApp/offline.html'))
        )
    );
    return;
  }

  // For static assets – cache first
  event.respondWith(
    caches.match(req).then(res =>
      res || fetch(req).then(networkRes =>
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, networkRes.clone());
          return networkRes;
        })
      )
    )
  );
});


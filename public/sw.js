
const CACHE_NAME = 'henrys-journey-v109'; // Increment to force cache refresh for all clients
const URLS_TO_CACHE = [
  '/index.html',
  '/manifest.json'
];

// Install: Cache core static assets
self.addEventListener('install', (event) => {
  // Force this new service worker to become the active one immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tell the active service worker to take control of the page immediately
      self.clients.claim()
    ])
  );
});

// Fetch: Network First for HTML, Cache First for Assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 1. Navigation requests (HTML pages) -> ALWAYS try network first to prevent version stickiness
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, clone it into cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If network fails (offline), return the cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = isSameOrigin && (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  );

  if (!isStaticAsset) {
    return;
  }

  // 2. Static assets -> Network First (latest), fallback to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

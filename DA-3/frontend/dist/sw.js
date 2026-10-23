/**
 * SocialSphere — Progressive Web App (PWA) Service Worker
 * Enables offline capability, instant app shell loading, and standalone mobile app experience.
 */

const CACHE_VERSION = 'v1.3.0';
const APP_SHELL_CACHE = `socialsphere-shell-${CACHE_VERSION}`;
const DATA_CACHE = `socialsphere-data-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// 1. INSTALL: Precache core app shell safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      console.log('[SW] Pre-caching core App Shell for mobile PWA...');
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[SW] Precache skipped for:', url, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE: Clean up legacy caches & take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== APP_SHELL_CACHE && cacheName !== DATA_CACHE) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Smart caching strategies for mobile app
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // Skip browser extensions and unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy A: HTML Page Navigation -> Network-first with offline App Shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Offline navigation, serving cached App Shell');
          const cached = await caches.match('/');
          if (cached) return cached;
          return new Response('<h1>SocialSphere is offline</h1><p>Please check your connection and reopen the app.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Strategy B: API Requests -> Network-First with Data Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Serving cached API data for:', url.pathname);
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline. Content will refresh when reconnected.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Strategy C: Static Assets (JS, CSS, Images, Fonts, Icons) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const copy = networkResponse.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});

// 4. MESSAGE: Allow client to trigger immediate update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 5. PUSH NOTIFICATIONS: Native mobile push notification support
self.addEventListener('push', (event) => {
  let data = { title: 'SocialSphere', body: 'You have new activity on SocialSphere.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title || 'SocialSphere', options));
});

// 6. NOTIFICATION CLICK: Open or focus the mobile app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

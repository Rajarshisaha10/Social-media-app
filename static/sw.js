/**
 * SocialSphere — Service Worker for Mobile PWA & Offline Caching
 * Caching Strategies:
 * 1. App Shell (HTML, CSS, JS, Manifest, Icons): Cache-First / Stale-While-Revalidate
 * 2. API Data (/api/posts, /api/users, /api/groups): Network-First with Cache Fallback
 * 3. External Media (Unsplash Images): Cache-First with max limit
 */

const CACHE_NAME = 'socialsphere-v1.2.0';
const STATIC_ASSETS = [
    '/',
    '/sql',
    '/static/style.css',
    '/static/app.js',
    '/static/manifest.json',
    '/static/icon-192.png',
    '/static/icon-512.png',
    '/static/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

// Install Event: Pre-cache core app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching core App Shell');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-First for API calls, Cache-First for static assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests (e.g. POST /api/posts, POST /api/users/login)
    if (request.method !== 'GET') {
        return;
    }

    // 1. API Calls: Network-First with Cache Fallback for offline usage
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    console.log('[Service Worker] Network failed, serving cached API data for:', url.pathname);
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return new Response(JSON.stringify({
                        success: false,
                        offline: true,
                        message: 'You are currently offline. Cached data unavailable for this endpoint.'
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // 2. Static Assets & App Shell: Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If offline and request is for navigation (page), return cached index.html
                if (request.mode === 'navigate') {
                    return caches.match('/');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});

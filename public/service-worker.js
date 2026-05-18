const CACHE_VERSION = 'vrcal-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const CONTENT_CACHE = `${CACHE_VERSION}-content`;

const APP_SHELL_URLS = [
    '/',
    '/favicon.svg',
    '/icons.svg',
    '/pwa-icon.svg',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png',
    '/pwa-icon-maskable.svg',
    '/pwa-icon-maskable-192.png',
    '/pwa-icon-maskable-512.png',
    '/manifest.webmanifest',
    '/theme/light.css',
    '/theme/dark.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CONTENT_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CONTENT_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return caches.match('/');
    }
}

self.addEventListener('fetch', (event) => {
    const {request} = event;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/theme/') || url.pathname === '/favicon.svg' || url.pathname === '/icons.svg' || url.pathname.startsWith('/pwa-icon')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    if (url.pathname.startsWith('/docs-content/')) {
        event.respondWith(networkFirst(request));
    }
});

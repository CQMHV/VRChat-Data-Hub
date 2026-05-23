const CACHE_NAME = 'vrcdh-pwa-cache-v2';
const STARTUP_URL = '/pwa-loading';
const STARTUP_PAGE_URL = STARTUP_URL;

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);
            await cache.add(new Request(STARTUP_PAGE_URL, {cache: 'reload'}));
        } catch (error) {
            console.warn('Precache failed:', error);
        }

        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((cacheName) => (
                cacheName === CACHE_NAME ? Promise.resolve() : caches.delete(cacheName)
            ))
        );

        if ('navigationPreload' in self.registration) {
            try {
                await self.registration.navigationPreload.enable();
            } catch {
            }
        }

        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const {request} = event;
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin || url.pathname !== STARTUP_URL) {
        return;
    }

    event.respondWith((async () => {
        const cachedResponse = await caches.match(STARTUP_PAGE_URL, {ignoreSearch: true});
        if (cachedResponse) {
            return cachedResponse;
        }

        const preloadedResponse = 'preloadResponse' in event ? await event.preloadResponse : null;
        if (preloadedResponse) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(STARTUP_PAGE_URL, preloadedResponse.clone());
            return preloadedResponse;
        }

        try {
            const response = await fetch(new Request(STARTUP_PAGE_URL, {cache: 'reload'}));
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(STARTUP_PAGE_URL, response.clone());
            }
            return response;
        } catch {
            return new Response('', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'text/html; charset=utf-8'
                }
            });
        }
    })());
});

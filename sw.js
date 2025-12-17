const CACHE_NAME = 'trieuministry-v8-ignore-search';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './profile.html',
    './blogs.html',
    './docs.html',
    './prayers.html',
    './donate.html',
    './assets/css/main.css',
    './assets/js/main.js',
    './assets/js/navigation.js',
    './assets/js/components.js',
    './assets/js/i18n.js',
    './assets/js/router.js',
    './assets/data/locales/vi.json',
    './assets/data/locales/en.json',
    './assets/images/icons/favicon.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install Event
self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all: app shell and content');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Fetch Event
// Network First Strategy
// Try network -> Update Cache -> Fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone response to cache it
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // If network fails, return from cache
                // Use ignoreSearch to match requests with query params (like ?v=4) against clean cache keys
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
    // Take control of all clients immediately
    event.waitUntil(clients.claim());

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

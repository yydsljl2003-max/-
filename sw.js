// ── Service Worker for 贪吃蛇 3D ──────────────────
var CACHE_NAME = 'snake3d-v2';
var CDN_PREFIX = 'https://cdn.jsdelivr.net/npm/three@0.137.0/';

var LOCAL_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/core.js',
    '/state.js',
    '/audio.js',
    '/scene.js',
    '/hud.js',
    '/menu.js',
    '/settings.js',
    '/leaderboard.js',
    '/gamemodes.js',
    '/combo.js',
    '/powerups.js',
    '/input.js',
    '/game.js',
    '/manifest.json'
];

var CDN_FILES = [
    'build/three.min.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            // Cache local files (must succeed)
            return cache.addAll(LOCAL_FILES).catch(function(err) {
                console.warn('SW: local cache partial failure', err);
            }).then(function() {
                // Cache CDN files (best-effort, don't block install)
                return Promise.all(
                    CDN_FILES.map(function(f) {
                        return cache.add(CDN_PREFIX + f).catch(function(err) {
                            console.warn('SW: CDN cache failed for', f, err);
                        });
                    })
                );
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        // Network-first: always try server first, fall back to cache
        fetch(event.request).then(function(response) {
            if (!response || response.status !== 200) return response;
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, clone);
            });
            return response;
        }).catch(function() {
            return caches.match(event.request).then(function(cached) {
                return cached || new Response('Offline', { status: 503 });
            });
        })
    );
});

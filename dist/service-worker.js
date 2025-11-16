/* Simple service worker to aggressively cache heavy static assets
 * (Unity WebGL build and game sounds) so returning players
 * don't need to re-download ~15MB+ on each visit.
 */

const CACHE_VERSION = "aviator-crash-v1";
const STATIC_CACHE = `aviator-static-${CACHE_VERSION}`;

// Basic shell assets to precache; heavy assets are cached on first use.
const PRECACHE_URLS = ["/", "/favicon.ico", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("aviator-static-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache safe GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  const isHeavyStatic =
    url.pathname.startsWith("/unity/") ||
    url.pathname.startsWith("/sound/") ||
    url.pathname === "/main.wav" ||
    url.pathname.endsWith(".wasm.unityweb") ||
    url.pathname.endsWith(".data.unityweb");

  if (isHeavyStatic) {
    // Cache-first strategy for heavy static assets:
    // serve from cache if available, otherwise fetch and store.
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});


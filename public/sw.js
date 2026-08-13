// v2: fixed a real bug — v1 cached the homepage (and every other page) on
// first visit and served that same stale copy forever, since dynamic pages
// were treated the same as static assets. Pages showing live data (the
// homepage's destination list, trip status, admin panel) must always be
// fetched fresh from the network. Only truly static files (icons, manifest)
// are safe to cache-first.

const CACHE_NAME = "travelly-v2";
const STATIC_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);

  // API calls and every page (HTML) always go to the network first — this
  // app is entirely live data (destinations, orders, itineraries), nothing
  // about it is safe to serve from a stale cache by default.
  if (!isStaticAsset) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache-first is fine, they don't change.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
    )
  );
});

// BUILD and FILES are injected by the static build.
const prefix = 'look-at-bobo:' + new URL(self.registration.scope).pathname + ':';
const version = prefix + BUILD;
const base = self.registration.scope;
const assets = new Set(FILES.map(file => new URL(file, base).href));
const home = new URL('index.html', base).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(version)
    .then(cache => cache.addAll([...assets]))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(prefix) && key !== version).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const navigation = request.mode === 'navigate' && (
    url.pathname === new URL(base).pathname || url.pathname === new URL(home).pathname
  ) && url.origin === new URL(base).origin;
  if (!navigation && !assets.has(url.href)) return;
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(version);
    return await cache.match(navigation ? home : url.href) ?? Response.error();
  }));
});

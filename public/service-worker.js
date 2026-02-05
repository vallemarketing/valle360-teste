const CACHE_NAME = 'valle360-v1';
const urlsToCache = [
  '/',
  '/app/dashboard',
  '/cliente/dashboard',
  '/icons/ICON (1).png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Valle 360', {
      body: data.body || 'Nova atualização disponível',
      icon: '/icons/ICON (1).png',
      badge: '/icons/ICON (1).png',
    })
  );
});

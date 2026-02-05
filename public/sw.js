/**
 * Service Worker for Valle 360
 * Handles push notifications and caching
 */

// Cache name for offline support
const CACHE_NAME = 'valle360-v1';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/valle-icon-192.png',
  '/icons/valle-badge-72.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event without data');
    return;
  }

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova notificação',
      icon: data.icon || '/icons/valle-icon-192.png',
      badge: data.badge || '/icons/valle-badge-72.png',
      image: data.image,
      tag: data.tag || 'default',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        ...data.data,
      },
      actions: data.actions || [],
      timestamp: data.timestamp || Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Valle 360', options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'approve':
        // Handle approve action
        event.waitUntil(
          fetch('/api/notifications/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'approve',
              data: event.notification.data,
            }),
          }).catch(console.error)
        );
        break;
      case 'reject':
        // Handle reject action
        event.waitUntil(
          fetch('/api/notifications/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'reject',
              data: event.notification.data,
            }),
          }).catch(console.error)
        );
        break;
      case 'snooze':
        // Handle snooze - schedule reminder for later
        break;
      default:
        // Default: open URL
        break;
    }
  }

  // Open or focus the app
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: event.notification.data,
            });
            return;
          }
        }
        // If no window/tab open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler (for analytics)
self.addEventListener('notificationclose', (event) => {
  // Track dismissed notifications if needed
  console.log('Notification dismissed:', event.notification.tag);
});

// Message handler for communication with the main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch handler for offline support
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests and external resources
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return null;
        });
    })
  );
});

// MisePro Service Worker - Version 2.9.1-handsfree-unblocked
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Service Worker offline pass-through fetch handler
});

// MisePro Service Worker - Version 2.6.0-prune-dead-code-and-safe-cards
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Dummy fetch event listener
});

// MisePro Service Worker - Version 2.9.0-handsfree-voice-unified
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Service Worker offline pass-through fetch handler
});

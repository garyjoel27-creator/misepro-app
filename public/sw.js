// MisePro Service Worker - Version 2.5.0-kds-redesign-and-semantic-voice
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Dummy fetch event listener
});

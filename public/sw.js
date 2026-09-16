// MisePro Service Worker - Version 2.3.0-appcc-sanitary-system
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Dummy fetch event listener
});

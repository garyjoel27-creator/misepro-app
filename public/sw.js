// MisePro Service Worker - Version 2.4.0-settings-fix-and-appcc-export
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Dummy fetch event listener
});

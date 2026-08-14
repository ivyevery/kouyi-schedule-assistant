const CACHE_NAME = "interpreter-assistant-v3";
const APP_SHELL = [
  "./",
  "./mobile-schedule.html",
  "./interpreter-schedule.html",
  "./app.webmanifest",
  "./pwa-register.js",
  "./cloud-sync.js",
  "./supabase-config.js",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/illustrations/home-calendar-sun.png",
  "./assets/illustrations/smart-entry.png",
  "./assets/illustrations/settings-sync-decoration.png",
  "./assets/mobile-banners/home-conference-740x330.jpg",
  "./assets/fonts/lobster/lobster-latin.woff2",
  "./assets/mobile-icons/home.png",
  "./assets/mobile-icons/calendar.png",
  "./assets/mobile-icons/add.png",
  "./assets/mobile-icons/setting.png",
  "./assets/desktop-banners/home-business-trip-2000x480.jpg",
  "./assets/desktop-banners/stats-conference-2000x480.jpg",
  "./assets/desktop-banners/after-study-2000x480.jpg",
  "./assets/desktop-banners/cv-resume-2000x480.jpg",
  "./assets/desktop-banners/accounting-bookkeeping-2000x480.jpg",
  "./assets/desktop-banners/settings-sync-2000x480.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(response => response || caches.match("./mobile-schedule.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});

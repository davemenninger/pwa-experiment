import { set, get } from "idb-keyval";

const current_cache_version = "v7";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(current_cache_version).then((cache) => {

      return cache.addAll([
        "/",
        "/app.css",
        "/main.js",
        "/android-chrome-192x192.png",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  var cacheKeeplist = [current_cache_version];

  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (cacheKeeplist.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

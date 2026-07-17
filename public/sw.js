const CACHE_VERSION = "event-staff-scanner-v4";

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_URL = "/staff/scanner";

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/pwa-192.png",
  "/icons/pwa-512.png",
  APP_SHELL_URL,
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installed:", CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });

            if (!response || !response.ok) {
              console.warn("[SW] Precache skipped:", url, response?.status);
              return;
            }

            await cache.put(url, response.clone());

            if (url === APP_SHELL_URL) {
              const pageCache = await caches.open(PAGE_CACHE);
              await pageCache.put(APP_SHELL_URL, response.clone());
            }
          } catch (error) {
            console.warn("[SW] Precache failed:", url, error);
          }
        }),
      );
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activated:", CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (url.pathname.startsWith("/api/")) return;

  if (url.origin !== self.location.origin) {
    event.respondWith(networkOnlyOrEmpty(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });

  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return new Response("", {
      status: 504,
      statusText: "Offline",
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });

  if (cached) {
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});

    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return new Response("", {
      status: 504,
      statusText: "Offline",
    });
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const url = new URL(request.url);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response.clone());

      if (url.pathname === APP_SHELL_URL) {
        await cache.put(APP_SHELL_URL, response.clone());
      }
    }

    return response;
  } catch {
    const cachedExact = await cache.match(request, { ignoreSearch: true });

    if (cachedExact) return cachedExact;

    const cachedShell = await cache.match(APP_SHELL_URL);

    if (cachedShell) return cachedShell;

    return getOfflineFallback();
  }
}

async function networkOnlyOrEmpty(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response("", {
      status: 504,
      statusText: "Offline",
    });
  }
}

function getOfflineFallback() {
  return new Response(
    `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Offline</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Arial, sans-serif;
              background: #f8f8ff;
              color: #2f3137;
            }

            .card {
              width: min(92vw, 420px);
              padding: 28px;
              border-radius: 28px;
              background: #fff;
              text-align: center;
              box-shadow: 0 24px 70px rgba(0,0,0,0.08);
            }

            h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 900;
            }

            p {
              margin: 12px 0 0;
              font-size: 14px;
              font-weight: 700;
              line-height: 1.8;
              opacity: 0.65;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>أنت غير متصل</h1>
            <p>
              افتح صفحة السكانر مرة واحدة أثناء وجود اتصال حتى تصبح متاحة بدون إنترنت.
            </p>
          </div>
        </body>
      </html>
    `,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

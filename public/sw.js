/* eslint-disable no-restricted-globals */

/**
 * Creative Staff Scanner Service Worker
 *
 * المسؤوليات:
 * - تشغيل صفحة السكانر عند انقطاع الإنترنت.
 * - تخزين ملفات Next.js الثابتة.
 * - تخزين الخطوط والصور المستخدمة في واجهة السكانر.
 * - عدم تخزين API responses أو طلبات المزامنة.
 * - تحديث الملفات تلقائيًا عند صدور نسخة جديدة.
 */

const CACHE_VERSION = "creative-staff-scanner-v8";

const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const CACHE_PREFIX = "creative-staff-scanner-";

const STAFF_SCANNER_PATH = "/staff/scanner";

const PRECACHE_URLS = [
  STAFF_SCANNER_PATH,
  "/manifest.webmanifest",
  "/favicon.ico",
];

/**
 * عدد الصور الأقصى داخل Runtime Image Cache.
 */
const MAX_IMAGE_CACHE_ENTRIES = 120;

/**
 * الطلبات التي لا يجوز تخزينها داخل Service Worker.
 */
function isApiRequest(url) {
  return (
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/api/v1/")
  );
}

function isAuthenticationRequest(url) {
  return (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/logout")
  );
}

function isDigitalTicketFile(url) {
  return url.pathname.includes("/uploads/digital-tickets/");
}

function isStaffScannerNavigation(request, url) {
  return (
    request.mode === "navigate" &&
    (url.pathname === STAFF_SCANNER_PATH ||
      url.pathname.startsWith(`${STAFF_SCANNER_PATH}/`))
  );
}

function isStaticAsset(request, url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "worker"
  );
}

function isImageRequest(request) {
  return request.destination === "image";
}

function isHttpRequest(url) {
  return url.protocol === "http:" || url.protocol === "https:";
}

function isCacheableResponse(response, options = {}) {
  if (!response) {
    return false;
  }

  if (response.type === "opaque") {
    return options.allowOpaque === true;
  }

  return (
    response.ok &&
    (response.type === "basic" ||
      response.type === "cors" ||
      response.type === "default")
  );
}

/**
 * يخزن رابطًا واحدًا دون إفشال عملية Install
 * إذا لم يكن الملف موجودًا.
 */
async function safePrecacheUrl(cache, url) {
  try {
    const request = new Request(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "reload",
    });

    const response = await fetch(request);

    if (!isCacheableResponse(response)) {
      console.warn(
        `[PWA] Precache skipped for ${url}. HTTP ${response.status}`,
      );

      return;
    }

    /**
     * لا نخزن صفحة Redirect بدل صفحة السكانر.
     * مثال: Redirect إلى login بسبب انتهاء الجلسة.
     */
    if (
      url === STAFF_SCANNER_PATH &&
      response.redirected &&
      !new URL(response.url).pathname.startsWith(STAFF_SCANNER_PATH)
    ) {
      console.warn(
        "[PWA] Scanner precache redirected outside the scanner route.",
      );

      return;
    }

    await cache.put(request, response.clone());
  } catch (error) {
    console.warn(`[PWA] Failed to precache ${url}:`, error);
  }
}

/**
 * يقلص Cache الصور حتى لا يكبر بلا حدود.
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length <= maxEntries) {
      return;
    }

    const deleteCount = keys.length - maxEntries;

    for (let index = 0; index < deleteCount; index += 1) {
      await cache.delete(keys[index]);
    }
  } catch (error) {
    console.warn("[PWA] Could not trim runtime cache:", error);
  }
}

/**
 * Install
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);

      await Promise.all(
        PRECACHE_URLS.map((url) => {
          return safePrecacheUrl(cache, url);
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

/**
 * Activate
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith(CACHE_PREFIX) &&
              cacheName !== APP_SHELL_CACHE &&
              cacheName !== STATIC_CACHE &&
              cacheName !== IMAGE_CACHE
            );
          })
          .map((cacheName) => caches.delete(cacheName)),
      );

      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (error) {
          console.warn("[PWA] Navigation preload could not be enabled:", error);
        }
      }

      await self.clients.claim();
    })(),
  );
});

/**
 * Network-first لاستدعاء صفحة السكانر.
 *
 * أثناء وجود الإنترنت:
 * - نأخذ أحدث نسخة.
 * - نخزن النسخة الناجحة.
 *
 * أثناء انقطاع الإنترنت:
 * - نرجع الصفحة المخزنة.
 */
async function handleScannerNavigation(event) {
  const request = event.request;
  const cache = await caches.open(APP_SHELL_CACHE);

  try {
    const preloadResponse = await event.preloadResponse;

    if (isCacheableResponse(preloadResponse)) {
      await cache.put(request, preloadResponse.clone());

      /**
       * نخزن نسخة بالمسار الأساسي أيضًا،
       * حتى تعمل الصفحة مع query parameters مختلفة.
       */
      await cache.put(
        new Request(STAFF_SCANNER_PATH, {
          credentials: "same-origin",
        }),
        preloadResponse.clone(),
      );

      return preloadResponse;
    }

    const response = await fetch(request);

    if (isCacheableResponse(response)) {
      const responseUrl = new URL(response.url);

      if (
        !response.redirected ||
        responseUrl.pathname.startsWith(STAFF_SCANNER_PATH)
      ) {
        await cache.put(request, response.clone());

        await cache.put(
          new Request(STAFF_SCANNER_PATH, {
            credentials: "same-origin",
          }),
          response.clone(),
        );
      }
    }

    return response;
  } catch (error) {
    console.warn(
      "[PWA] Scanner navigation failed. Falling back to cache.",
      error,
    );

    const exactCachedResponse = await cache.match(request, {
      ignoreSearch: true,
    });

    if (exactCachedResponse) {
      return exactCachedResponse;
    }

    const scannerCachedResponse = await cache.match(STAFF_SCANNER_PATH, {
      ignoreSearch: true,
    });

    if (scannerCachedResponse) {
      return scannerCachedResponse;
    }

    return createOfflineFallbackResponse();
  }
}

/**
 * Cache-first للملفات الثابتة ذات الأسماء الموقعة Hash.
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);

  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return new Response("", {
      status: 504,
      statusText: "Static asset unavailable offline",
    });
  }
}

/**
 * Stale-while-revalidate للصور.
 *
 * نرجع الصورة المخزنة فورًا، ثم نحاول تحديثها بالخلفية.
 */
async function handleImageRequest(event) {
  const request = event.request;
  const cache = await caches.open(IMAGE_CACHE);

  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (
        isCacheableResponse(response, {
          allowOpaque: true,
        })
      ) {
        await cache.put(request, response.clone());

        void trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_ENTRIES);
      }

      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    event.waitUntil(networkPromise);

    return cachedResponse;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  return createImageFallbackResponse();
}

/**
 * صفحة بسيطة لا تظهر إلا إذا لم يتم تخزين
 * صفحة السكانر قبل قطع الإنترنت.
 */
function createOfflineFallbackResponse() {
  const html = `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />

    <meta name="theme-color" content="#111111" />

    <title>السكانر غير متصل</title>

    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family:
          Arial,
          Tahoma,
          sans-serif;
        background:
          radial-gradient(
            circle at top right,
            rgba(33, 183, 216, 0.18),
            transparent 38%
          ),
          #f7f8fc;
        color: #2f3137;
      }

      main {
        width: min(100%, 480px);
        padding: 34px 24px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 28px;
        background: white;
        text-align: center;
        box-shadow:
          0 24px 70px rgba(0, 0, 0, 0.08);
      }

      .icon {
        width: 82px;
        height: 82px;
        margin-inline: auto;
        display: grid;
        place-items: center;
        border-radius: 24px;
        background: #eefaff;
        font-size: 38px;
      }

      h1 {
        margin: 22px 0 8px;
        font-size: 28px;
      }

      p {
        margin: 0;
        color: rgba(47, 49, 55, 0.65);
        font-size: 15px;
        font-weight: 700;
        line-height: 1.9;
      }

      button {
        width: 100%;
        margin-top: 24px;
        padding: 14px 20px;
        border: 0;
        border-radius: 16px;
        background: #21b7d8;
        color: #06171c;
        cursor: pointer;
        font-size: 15px;
        font-weight: 800;
      }
    </style>
  </head>

  <body>
    <main>
      <div class="icon">📡</div>

      <h1>السكانر غير متصل</h1>

      <p>
        لم يتم حفظ صفحة السكانر على هذا الجهاز بعد.
        افتح الصفحة مرة واحدة أثناء وجود الإنترنت،
        ثم أعد تجربة وضع Offline.
      </p>

      <button type="button" onclick="window.location.reload()">
        إعادة المحاولة
      </button>
    </main>
  </body>
</html>
  `.trim();

  return new Response(html, {
    status: 200,

    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function createImageFallbackResponse() {
  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="320"
  height="200"
  viewBox="0 0 320 200"
>
  <rect
    width="320"
    height="200"
    rx="20"
    fill="#f3f4f8"
  />

  <text
    x="160"
    y="92"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="36"
  >
    🖼️
  </text>

  <text
    x="160"
    y="130"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="14"
    fill="#666"
  >
    Image unavailable offline
  </text>
</svg>
  `.trim();

  return new Response(svg, {
    status: 200,

    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Fetch
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (!isHttpRequest(url)) {
    return;
  }

  /**
   * API لا يتم تخزينه هنا.
   *
   * بيانات الزوار والعمليات الأوفلاين تحفظ في IndexedDB.
   */
  if (isApiRequest(url)) {
    return;
  }

  /**
   * لا نخزن تسجيل الدخول والخروج.
   */
  if (isAuthenticationRequest(url)) {
    return;
  }

  /**
   * صور بطاقات الدخول لا نخزنها ضمن Service Worker
   * لأنها قد تحتوي بيانات شخصية.
   */
  if (isDigitalTicketFile(url)) {
    return;
  }

  if (isStaffScannerNavigation(request, url)) {
    event.respondWith(handleScannerNavigation(event));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(event));
  }
});

/**
 * Messages from the page.
 */
self.addEventListener("message", (event) => {
  const data = event.data;

  if (!data || typeof data !== "object") {
    return;
  }

  if (data.type === "SKIP_WAITING") {
    void self.skipWaiting();
    return;
  }

  if (data.type === "CACHE_STAFF_SCANNER") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);

        await safePrecacheUrl(cache, STAFF_SCANNER_PATH);
      })(),
    );
    return;
  }

  if (data.type === "CLEAR_RUNTIME_CACHES") {
    event.waitUntil(
      Promise.all([caches.delete(STATIC_CACHE), caches.delete(IMAGE_CACHE)]),
    );
  }
});

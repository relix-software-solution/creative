"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";
const SERVICE_WORKER_SCOPE = "/";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.warn("[PWA] Service workers are not supported.");
      return;
    }

    if (!window.isSecureContext) {
      console.warn(
        "[PWA] Service worker registration requires HTTPS or localhost.",
      );
      return;
    }

    let cancelled = false;

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_URL,
          {
            scope: SERVICE_WORKER_SCOPE,
            updateViaCache: "none",
          },
        );

        if (cancelled) {
          return;
        }

        console.info("[PWA] Service worker registered:", registration.scope);

        try {
          await registration.update();
        } catch (error) {
          console.warn("[PWA] Service worker update check failed:", error);
        }

        if (registration.installing) {
          console.info("[PWA] Service worker is installing.");
        }

        if (registration.waiting) {
          registration.waiting.postMessage({
            type: "SKIP_WAITING",
          });
        }

        if (registration.active) {
          console.info("[PWA] Service worker is active.");
        }
      } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
      }
    }

    function handleControllerChange() {
      console.info("[PWA] The page is now controlled by the service worker.");
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    if (document.readyState === "complete") {
      void registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, {
        once: true,
      });
    }

    return () => {
      cancelled = true;

      window.removeEventListener("load", registerServiceWorker);

      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  return null;
}

export default PwaRegister;

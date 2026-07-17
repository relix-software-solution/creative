"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[PWA] Skipped service worker in development mode");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.log("[PWA] Service worker is not supported");
      return;
    }

    function registerServiceWorker() {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("[PWA] Service worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service worker registration failed:", error);
        });
    }

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

const VELI_CACHE_PREFIX = "veli-pwa-";

async function removeDevelopmentPwaState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL;
        return scriptUrl ? new URL(scriptUrl).pathname === "/sw.js" : false;
      })
      .map((registration) => registration.unregister()),
  );

  if (!("caches" in window)) return;
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(VELI_CACHE_PREFIX))
      .map((cacheName) => caches.delete(cacheName)),
  );
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void removeDevelopmentPwaState();
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

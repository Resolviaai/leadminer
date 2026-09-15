"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] ServiceWorker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] ServiceWorker registration failed:", err);
        });
    }
  }, []);

  return null;
}
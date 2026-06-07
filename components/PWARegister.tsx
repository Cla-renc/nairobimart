"use client";
import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          console.log('Service worker registered:', reg);

          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content available; please refresh.');
                } else {
                  console.log('Content cached for offline use.');
                }
              }
            });
          });
        } catch (err) {
          console.error('Service worker registration failed:', err);
        }
      });
    }
  }, []);

  return null;
}

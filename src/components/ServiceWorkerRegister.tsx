"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability/offline fallback is a nice-to-have, not required
        // for the app to function — a failed registration shouldn't be
        // surfaced to the user.
      });
    }
  }, []);

  return null;
}

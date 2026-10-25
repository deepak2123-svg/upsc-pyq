"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Always revalidate the worker itself. Otherwise an installed copy can keep
    // an older application shell alive after a production release.
    void navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration?.update())
      .catch(() => { /* Practice still works when offline caching is unavailable. */ });
  }, []);
  return null;
}

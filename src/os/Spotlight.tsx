"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useOSState } from "./OSContext";

/** The dialog and the search index (every piece of content) stay out of the initial bundle. */
const SpotlightDialog = dynamic(() => import("./SpotlightDialog"), { ssr: false });

export function Spotlight() {
  const open = useOSState((s) => s.spotlightOpen);

  // Preload once the browser is idle so the first Ctrl/⌘ K opens instantly.
  useEffect(() => {
    const preload = () => void import("./SpotlightDialog");
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = setTimeout(preload, 1500);
    return () => clearTimeout(handle);
  }, []);

  return open ? <SpotlightDialog /> : null;
}

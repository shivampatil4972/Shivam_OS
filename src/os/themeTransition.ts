"use client";

import type { Prefs } from "./state/prefsCore";
import { getPrefs, setPrefs } from "./state/prefs";

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void> } };

function motionReduced(): boolean {
  const motion = getPrefs().motion;
  if (motion === "off" || motion === "reduced") return true;
  if (motion === "full") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Switches the theme with a circular reveal that grows from `origin` (usually the
 * control that was used). Falls back to an instant switch where the View
 * Transitions API is missing or motion is reduced.
 */
export function switchTheme(theme: Prefs["theme"], origin?: { x: number; y: number } | HTMLElement | null) {
  const apply = () => setPrefs({ theme });
  const doc = document as ViewTransitionDocument;
  const before = document.documentElement.dataset.theme;
  if (!doc.startViewTransition || motionReduced()) {
    apply();
    return;
  }
  let x = window.innerWidth - 80;
  let y = 16;
  if (origin instanceof HTMLElement) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (origin) {
    ({ x, y } = origin);
  }
  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      // Nothing visible changed (e.g. "system" resolved to the same theme): skip the effect.
      if (document.documentElement.dataset.theme === before) return;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(0.22, 0.9, 0.24, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}

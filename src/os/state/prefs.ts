"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PREFS, PREFS_KEY, applyPrefs, loadPrefs, parsePrefs, savePrefs, type Prefs } from "./prefsCore";

export * from "./prefsCore";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
let current: Prefs = DEFAULT_PREFS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function initPrefs() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  current = loadPrefs();
  applyPrefs(current);
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (current.theme === "system") applyPrefs(current);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === PREFS_KEY) {
      current = loadPrefs();
      applyPrefs(current);
      emit();
    }
  });
  emit();
}

export function getPrefs(): Prefs {
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  current = parsePrefs({ ...current, ...patch });
  if (typeof window !== "undefined") {
    savePrefs(current);
    applyPrefs(current);
  }
  emit();
}

export function resetPrefs() {
  current = { ...DEFAULT_PREFS };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PREFS_KEY);
    } catch {
      // ignore
    }
    applyPrefs(current);
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULT_PREFS);
}

/** True when animations should be reduced: user setting, or system preference when set to follow it. */
export function useReducedMotion(): boolean {
  const prefs = usePrefs();
  const system = useSyncExternalStore(
    (cb) => {
      const mq = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null;
      mq?.addEventListener?.("change", cb);
      return () => mq?.removeEventListener?.("change", cb);
    },
    () => (typeof window !== "undefined" ? (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false) : false),
    () => false,
  );
  if (prefs.motion === "off" || prefs.motion === "reduced") return true;
  if (prefs.motion === "full") return false;
  return system;
}

/** The theme actually applied to <html> ("system" resolved). Server snapshot is dark. */
export function useResolvedTheme(): "dark" | "light" {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      mq?.addEventListener?.("change", cb);
      return () => {
        listeners.delete(cb);
        mq?.removeEventListener?.("change", cb);
      };
    },
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark",
  );
}

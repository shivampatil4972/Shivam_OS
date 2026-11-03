export const ACCENTS = ["blue", "violet", "cyan", "green", "orange", "pink", "graphite"] as const;
export const WALLPAPERS = ["aurora", "graphite", "tide", "mist"] as const;
const THEMES = ["system", "dark", "light"] as const;
const GLASS = ["clear", "balanced", "tinted", "solid"] as const;
const MOTION = ["system", "full", "reduced", "off"] as const;
const DOCK_SIZES = ["small", "medium", "large"] as const;

export interface Prefs {
  theme: (typeof THEMES)[number];
  accent: (typeof ACCENTS)[number];
  glass: (typeof GLASS)[number];
  wallpaper: (typeof WALLPAPERS)[number];
  motion: (typeof MOTION)[number];
  dockMagnify: boolean;
  dockSize: (typeof DOCK_SIZES)[number];
  showBoot: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  accent: "blue",
  glass: "balanced",
  wallpaper: "aurora",
  motion: "system",
  dockMagnify: true,
  dockSize: "medium",
  showBoot: true,
};

export const PREFS_KEY = "shivam-os:prefs:v1";

/** Picks `value` if it is one of `allowed`, otherwise the fallback. Kept dependency-free for the initial bundle. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

/** Parse anything (including corrupted storage) into valid preferences; each invalid field falls back on its own. */
export function parsePrefs(raw: unknown): Prefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const p = raw as Record<string, unknown>;
  return {
    theme: oneOf(p.theme, THEMES, DEFAULT_PREFS.theme),
    accent: oneOf(p.accent, ACCENTS, DEFAULT_PREFS.accent),
    glass: oneOf(p.glass, GLASS, DEFAULT_PREFS.glass),
    wallpaper: oneOf(p.wallpaper, WALLPAPERS, DEFAULT_PREFS.wallpaper),
    motion: oneOf(p.motion, MOTION, DEFAULT_PREFS.motion),
    dockMagnify: bool(p.dockMagnify, DEFAULT_PREFS.dockMagnify),
    dockSize: oneOf(p.dockSize, DOCK_SIZES, DEFAULT_PREFS.dockSize),
    showBoot: bool(p.showBoot, DEFAULT_PREFS.showBoot),
  };
}

export function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); preferences then last for the session.
  }
}

export function resolveTheme(theme: Prefs["theme"], systemDark: boolean): "dark" | "light" {
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}

export function applyPrefs(prefs: Prefs, root: HTMLElement = document.documentElement) {
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  root.dataset.theme = resolveTheme(prefs.theme, systemDark);
  root.dataset.accent = prefs.accent;
  root.dataset.glass = prefs.glass;
  root.dataset.wallpaper = prefs.wallpaper;
  root.dataset.motion = prefs.motion;
  root.dataset.dock = prefs.dockSize;
}

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Kept dependency-free and tolerant of corrupted storage.
 */
export const PREFS_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,p={};try{p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}")||{}}catch(e){}var t=p.theme==="dark"||p.theme==="light"?p.theme:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.dataset.theme=t;var ok=function(v,l,f){return l.indexOf(v)>-1?v:f};d.dataset.accent=ok(p.accent,${JSON.stringify(
  ACCENTS,
)},"blue");d.dataset.glass=ok(p.glass,["clear","balanced","tinted","solid"],"balanced");d.dataset.wallpaper=ok(p.wallpaper,${JSON.stringify(
  WALLPAPERS,
)},"aurora");d.dataset.motion=ok(p.motion,["system","full","reduced","off"],"system");d.dataset.dock=ok(p.dockSize,["small","medium","large"],"medium");var seen=false;try{seen=sessionStorage.getItem("shivam-os:booted")==="1"}catch(e){}if(p.showBoot===false||seen)d.dataset.skipBoot="true"}catch(e){}})();`;

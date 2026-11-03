"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getProject } from "@/content/projects";
import { APPS, DOCK_APPS, type AppId } from "./apps";
import { intentToPath, pathToIntent, type Intent } from "./routes";
import { publishActivity } from "./state/activity";
import { createOSStore, useStoreSelector, type OSState, type OSStore } from "./state/store";
import type { WindowState } from "./state/windows";

interface OSApi {
  store: OSStore;
  open: (app: AppId, params?: Record<string, string>, opts?: { trigger?: HTMLElement | null; silent?: boolean }) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  focus: (id: string) => void;
  setParams: (app: AppId, params: Record<string, string>) => void;
  /** Mobile: leave the current app and show the home screen. */
  goHome: () => void;
}

const OSContext = createContext<OSApi | null>(null);

let hydrated = false;
/** False during server rendering and hydration; true once the OS has mounted in the browser. */
export function isHydrated() {
  return hydrated;
}

export function useOS(): OSApi {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used inside <OSProvider>");
  return ctx;
}

export function useOSState<T>(selector: (s: OSState) => T, isEqual?: (a: T, b: T) => boolean): T {
  const { store } = useOS();
  return useStoreSelector(store, selector, isEqual);
}

export function windowTitle(w: Pick<WindowState, "app" | "params">): string {
  if (w.app === "projects" && w.params.slug) return getProject(w.params.slug)?.title ?? APPS.projects.title;
  return APPS[w.app].title;
}

const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

function focusedIntent(state: OSState): Intent {
  const w = state.wm.windows.find((x) => x.id === state.wm.focusedId && !x.minimized);
  if (!w) return { type: "desktop" };
  return { type: "app", app: w.app, params: w.params };
}

export function OSProvider({ initial, children }: { initial: OSState; children: ReactNode }) {
  const [store] = useState<OSStore>(() => createOSStore(initial));
  const triggers = useRef(new Map<string, HTMLElement>());
  const nav = useRef<"push" | "replace" | "none">("replace");

  const focusWindowSoon = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-window-id="${id}"] [data-window-focus]`);
      el?.focus({ preventScroll: true });
    });
  }, []);

  const open = useCallback<OSApi["open"]>(
    (app, params, opts) => {
      const id = `win-${app}`;
      if (opts?.trigger) triggers.current.set(id, opts.trigger);
      nav.current = "push";
      store.dispatch({ type: "open", app, params });
      focusWindowSoon(id);
      if (!opts?.silent) {
        const title = app === "projects" && params?.slug ? (getProject(params.slug)?.title ?? APPS[app].title) : APPS[app].title;
        publishActivity({ kind: "opened", title: `${title}`, detail: app === "projects" && params?.slug ? "Case study opened" : "App opened" });
      }
    },
    [store, focusWindowSoon],
  );

  const restoreFocusAfter = useCallback(
    (id: string) => {
      const trigger = triggers.current.get(id);
      triggers.current.delete(id);
      requestAnimationFrame(() => {
        if (trigger && document.body.contains(trigger) && trigger.offsetParent !== null) {
          trigger.focus({ preventScroll: true });
          return;
        }
        const next = store.getState().wm.focusedId;
        if (next) focusWindowSoon(next);
        else document.querySelector<HTMLElement>("[data-desktop-focus]")?.focus({ preventScroll: true });
      });
    },
    [store, focusWindowSoon],
  );

  const close = useCallback<OSApi["close"]>(
    (id) => {
      nav.current = "replace";
      store.dispatch({ type: "close", id });
      restoreFocusAfter(id);
    },
    [store, restoreFocusAfter],
  );

  const minimize = useCallback<OSApi["minimize"]>(
    (id) => {
      nav.current = "replace";
      store.dispatch({ type: "minimize", id });
      restoreFocusAfter(id);
    },
    [store, restoreFocusAfter],
  );

  const focus = useCallback<OSApi["focus"]>(
    (id) => {
      nav.current = "replace";
      store.dispatch({ type: "focus", id });
    },
    [store],
  );

  const setParams = useCallback<OSApi["setParams"]>(
    (app, params) => {
      nav.current = "push";
      store.dispatch({ type: "setParams", id: `win-${app}`, params });
    },
    [store],
  );

  const goHome = useCallback(() => {
    nav.current = "push";
    store.dispatch({ type: "minimizeAll" });
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-desktop-focus]")?.focus({ preventScroll: true }));
  }, [store]);

  // --- Ready marker: lets tests and scripts wait for hydration ------------
  useEffect(() => {
    hydrated = true;
    document.documentElement.dataset.osReady = "true";
  }, []);

  // --- Viewport tracking --------------------------------------------------
  useEffect(() => {
    const sync = () => store.dispatch({ type: "viewport", viewport: { w: window.innerWidth, h: window.innerHeight } });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [store]);

  // --- URL + document title follow the focused window ----------------------
  useEffect(() => {
    const fromUrl = pathToIntent(window.location.pathname, window.location.search);
    if (window.location.search && fromUrl.type === "app" && fromUrl.params) {
      store.dispatch({ type: "setParams", id: `win-${fromUrl.app}`, params: fromUrl.params });
    }
    let lastPath = window.location.pathname + window.location.search;
    const sync = () => {
      const state = store.getState();
      const intent = focusedIntent(state);
      const path = intentToPath(intent);
      const focused = state.wm.windows.find((w) => w.id === state.wm.focusedId && !w.minimized);
      document.title = focused ? `${windowTitle(focused)} — SHIVAM.OS` : "SHIVAM.OS — Shivam Patil, Software Engineer";
      if (path !== lastPath) {
        if (nav.current === "push") window.history.pushState(window.history.state, "", path);
        else window.history.replaceState(window.history.state, "", path);
        lastPath = path;
      }
      nav.current = "replace";
    };
    const unsubscribe = store.subscribe(sync);
    const onPop = () => {
      const intent = pathToIntent(window.location.pathname, window.location.search);
      lastPath = window.location.pathname + window.location.search;
      nav.current = "none";
      if (intent.type === "desktop") {
        if (isMobile()) store.dispatch({ type: "minimizeAll" });
        else store.dispatch({ type: "open", app: "home" });
      } else {
        store.dispatch({ type: "open", app: intent.app, params: intent.params ?? {} });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      unsubscribe();
      window.removeEventListener("popstate", onPop);
    };
  }, [store]);

  // --- Global keyboard shortcuts --------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = store.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.altKey && e.code === "KeyK") {
        e.preventDefault();
        store.dispatch({ type: "spotlight", open: !state.spotlightOpen });
        return;
      }
      if (e.key === "Escape" && state.contextMenu) {
        store.dispatch({ type: "contextMenu", at: null });
        return;
      }
      if (!(e.altKey && e.shiftKey) || mod) return;
      const focused = state.wm.focusedId;
      switch (e.code) {
        case "KeyW":
          if (focused) close(focused);
          break;
        case "KeyM":
          if (focused) minimize(focused);
          break;
        case "KeyF":
          if (focused) store.dispatch({ type: "toggleMaximize", id: focused });
          break;
        case "KeyO":
          store.dispatch({ type: "overview", open: !state.overviewOpen });
          break;
        case "Backquote":
          store.dispatch({ type: "cycleFocus", direction: 1 });
          if (store.getState().wm.focusedId) focusWindowSoon(store.getState().wm.focusedId!);
          break;
        case "ArrowLeft":
        case "ArrowRight":
          if (focused) store.dispatch({ type: "snap", id: focused, side: e.code === "ArrowLeft" ? "left" : "right" });
          break;
        case "Slash":
          store.dispatch({ type: "shortcuts", open: true });
          break;
        default: {
          const digit = /^Digit([1-9])$/.exec(e.code);
          if (digit) {
            const app = DOCK_APPS[Number(digit[1]) - 1];
            if (app) open(app);
          } else return;
        }
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, open, close, minimize, focusWindowSoon]);

  const api = useMemo<OSApi>(() => ({ store, open, close, minimize, focus, setParams, goHome }), [store, open, close, minimize, focus, setParams, goHome]);
  return <OSContext.Provider value={api}>{children}</OSContext.Provider>;
}

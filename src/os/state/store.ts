import { useRef, useSyncExternalStore } from "react";
import type { AppId } from "../apps";
import { initialWindowState, windowReducer, type WindowAction, type WindowManagerState } from "./windows";

export interface OSState {
  wm: WindowManagerState;
  spotlightOpen: boolean;
  overviewOpen: boolean;
  shortcutsOpen: boolean;
  contextMenu: { x: number; y: number } | null;
}

export type OSAction =
  | WindowAction
  | { type: "spotlight"; open: boolean }
  | { type: "overview"; open: boolean }
  | { type: "shortcuts"; open: boolean }
  | { type: "contextMenu"; at: { x: number; y: number } | null };

export function osReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case "spotlight":
      return { ...state, spotlightOpen: action.open, overviewOpen: false, contextMenu: null };
    case "overview":
      return { ...state, overviewOpen: action.open, spotlightOpen: false, contextMenu: null };
    case "shortcuts":
      return { ...state, shortcutsOpen: action.open };
    case "contextMenu":
      return { ...state, contextMenu: action.at };
    default: {
      const wm = windowReducer(state.wm, action);
      return wm === state.wm ? state : { ...state, wm };
    }
  }
}

export function createInitialOSState(open: Array<{ app: AppId; params?: Record<string, string>; auto?: boolean }> = []): OSState {
  let wm = initialWindowState();
  for (const o of open) wm = windowReducer(wm, { type: "open", ...o });
  return { wm, spotlightOpen: false, overviewOpen: false, shortcutsOpen: false, contextMenu: null };
}

// ---------------------------------------------------------------------------
// A tiny external store with selector subscriptions, so dragging one window
// re-renders that window only.
// ---------------------------------------------------------------------------
export interface OSStore {
  getState: () => OSState;
  dispatch: (action: OSAction) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createOSStore(initial: OSState): OSStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = osReducer(state, action);
      if (next !== state) {
        state = next;
        listeners.forEach((l) => l());
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStoreSelector<T>(store: OSStore, selector: (s: OSState) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const cache = useRef<{ state: OSState; value: T } | null>(null);
  const get = () => {
    const s = store.getState();
    if (cache.current && cache.current.state === s) return cache.current.value;
    const value = selector(s);
    if (cache.current && isEqual(cache.current.value, value)) {
      cache.current = { state: s, value: cache.current.value };
      return cache.current.value;
    }
    cache.current = { state: s, value };
    return value;
  };
  return useSyncExternalStore(store.subscribe, get, get);
}

export function shallowEqualArray<T>(a: readonly T[], b: readonly T[]) {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}

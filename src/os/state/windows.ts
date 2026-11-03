import { APPS, type AppId } from "../apps";

export const MENUBAR_H = 34;
export const MIN_W = 360;
export const MIN_H = 260;
/** At least this much of a window's title bar must stay on screen. */
export const VISIBLE_GRIP = 120;
const TITLEBAR_H = 44;
const DOCK_RESERVE = 96;

export interface Viewport {
  w: number;
  h: number;
}

export interface WindowState {
  id: string;
  app: AppId;
  params: Record<string, string>;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Opened automatically (the Home window on first load), not by the visitor. */
  auto: boolean;
}

export interface WindowManagerState {
  windows: WindowState[];
  focusedId: string | null;
  zTop: number;
  viewport: Viewport;
}

export type WindowAction =
  | { type: "open"; app: AppId; params?: Record<string, string>; auto?: boolean }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "minimize"; id: string }
  | { type: "restore"; id: string }
  | { type: "toggleMaximize"; id: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; w: number; h: number }
  | { type: "snap"; id: string; side: "left" | "right" }
  | { type: "setParams"; id: string; params: Record<string, string> }
  | { type: "viewport"; viewport: Viewport }
  | { type: "minimizeAll" }
  | { type: "closeAll" }
  | { type: "cycleFocus"; direction: 1 | -1 };

export const DEFAULT_VIEWPORT: Viewport = { w: 1440, h: 900 };

export function initialWindowState(viewport: Viewport = DEFAULT_VIEWPORT): WindowManagerState {
  return { windows: [], focusedId: null, zTop: 0, viewport };
}

const windowId = (app: AppId) => `win-${app}`;

/** Keep a window reachable: its title bar stays below the menu bar and partly on screen. */
export function clampGeometry(
  g: { x: number; y: number; w: number; h: number },
  vp: Viewport,
): { x: number; y: number; w: number; h: number } {
  const maxW = Math.max(MIN_W, vp.w - 16);
  const maxH = Math.max(MIN_H, vp.h - MENUBAR_H - 16);
  const w = Math.round(Math.min(Math.max(g.w, MIN_W), maxW));
  const h = Math.round(Math.min(Math.max(g.h, MIN_H), maxH));
  const minX = VISIBLE_GRIP - w;
  const maxX = vp.w - VISIBLE_GRIP;
  const minY = MENUBAR_H;
  const maxY = Math.max(minY, vp.h - TITLEBAR_H);
  const x = Math.round(Math.min(Math.max(g.x, minX), maxX));
  const y = Math.round(Math.min(Math.max(g.y, minY), maxY));
  return { x, y, w, h };
}

/** Cascade new windows from the centre so several open windows stay distinguishable. */
export function defaultGeometry(app: AppId, vp: Viewport, openCount: number) {
  const size = APPS[app].size;
  // On wide screens keep new windows clear of the desktop shortcuts (left) and widgets (right).
  const reserveLeft = vp.w >= 1280 ? 124 : 0;
  const reserveRight = vp.w >= 1280 ? 332 : 0;
  const area = vp.w - reserveLeft - reserveRight;
  const w = Math.min(size.w, area - 24, vp.w - 48);
  const h = Math.min(size.h, vp.h - MENUBAR_H - DOCK_RESERVE - 16);
  const offset = (openCount % 6) * 28;
  const x = Math.round(reserveLeft + (area - w) / 2 + offset);
  const y = Math.round(MENUBAR_H + Math.max(12, (vp.h - MENUBAR_H - DOCK_RESERVE - h) / 2) - 20 + offset);
  return clampGeometry({ x, y, w, h }, vp);
}

function topVisible(windows: WindowState[], exclude?: string): string | null {
  const candidates = windows.filter((w) => !w.minimized && w.id !== exclude).sort((a, b) => b.z - a.z);
  return candidates[0]?.id ?? null;
}

function update(state: WindowManagerState, id: string, fn: (w: WindowState) => WindowState): WindowManagerState {
  if (!state.windows.some((w) => w.id === id)) return state;
  return { ...state, windows: state.windows.map((w) => (w.id === id ? fn(w) : w)) };
}

function bringToFront(state: WindowManagerState, id: string): WindowManagerState {
  const target = state.windows.find((w) => w.id === id);
  if (!target) return state;
  if (state.focusedId === id && target.z === state.zTop && !target.minimized) return state;
  const zTop = state.zTop + 1;
  return {
    ...state,
    zTop,
    focusedId: id,
    windows: state.windows.map((w) => (w.id === id ? { ...w, z: zTop, minimized: false } : w)),
  };
}

export function windowReducer(state: WindowManagerState, action: WindowAction): WindowManagerState {
  switch (action.type) {
    case "open": {
      const id = windowId(action.app);
      const existing = state.windows.find((w) => w.id === id);
      if (existing) {
        const withParams = update(state, id, (w) => ({
          ...w,
          params: action.params ?? w.params,
          auto: action.auto ?? false,
        }));
        return bringToFront(withParams, id);
      }
      const geometry = defaultGeometry(action.app, state.viewport, state.windows.length);
      const zTop = state.zTop + 1;
      const win: WindowState = {
        id,
        app: action.app,
        params: action.params ?? {},
        ...geometry,
        z: zTop,
        minimized: false,
        maximized: false,
        auto: action.auto ?? false,
      };
      return { ...state, zTop, focusedId: id, windows: [...state.windows, win] };
    }
    case "close": {
      if (!state.windows.some((w) => w.id === action.id)) return state;
      const windows = state.windows.filter((w) => w.id !== action.id);
      const focusedId = state.focusedId === action.id ? topVisible(windows) : state.focusedId;
      return { ...state, windows, focusedId };
    }
    case "focus":
      return bringToFront(state, action.id);
    case "minimize": {
      const next = update(state, action.id, (w) => ({ ...w, minimized: true }));
      if (next === state) return state;
      return { ...next, focusedId: state.focusedId === action.id ? topVisible(next.windows, action.id) : state.focusedId };
    }
    case "restore":
      return bringToFront(update(state, action.id, (w) => ({ ...w, minimized: false })), action.id);
    case "toggleMaximize":
      return bringToFront(update(state, action.id, (w) => ({ ...w, maximized: !w.maximized })), action.id);
    case "move":
      return update(state, action.id, (w) => ({
        ...w,
        maximized: false,
        ...clampGeometry({ x: action.x, y: action.y, w: w.w, h: w.h }, state.viewport),
      }));
    case "resize":
      return update(state, action.id, (w) => ({
        ...w,
        maximized: false,
        ...clampGeometry({ x: w.x, y: w.y, w: action.w, h: action.h }, state.viewport),
      }));
    case "snap": {
      const vp = state.viewport;
      const w = Math.floor((vp.w - 24) / 2);
      const h = vp.h - MENUBAR_H - DOCK_RESERVE - 8;
      const x = action.side === "left" ? 8 : vp.w - w - 8;
      return bringToFront(
        update(state, action.id, (win) => ({ ...win, maximized: false, ...clampGeometry({ x, y: MENUBAR_H + 8, w, h }, vp) })),
        action.id,
      );
    }
    case "setParams":
      return update(state, action.id, (w) => ({ ...w, params: action.params }));
    case "viewport": {
      const viewport = { w: Math.max(320, action.viewport.w), h: Math.max(320, action.viewport.h) };
      return {
        ...state,
        viewport,
        windows: state.windows.map((w) => ({ ...w, ...clampGeometry(w, viewport) })),
      };
    }
    case "minimizeAll":
      return { ...state, focusedId: null, windows: state.windows.map((w) => ({ ...w, minimized: true })) };
    case "closeAll":
      return { ...state, focusedId: null, windows: [] };
    case "cycleFocus": {
      const visible = state.windows.filter((w) => !w.minimized).sort((a, b) => a.z - b.z);
      if (visible.length < 2) return state;
      // Bring the window at the bottom to the front (forward), or send the front one to the back.
      if (action.direction === 1) return bringToFront(state, visible[0]!.id);
      const front = visible[visible.length - 1]!;
      const minZ = visible[0]!.z - 1;
      const windows = state.windows.map((w) => (w.id === front.id ? { ...w, z: minZ } : w));
      return { ...state, windows, focusedId: visible[visible.length - 2]!.id };
    }
    default:
      return state;
  }
}

export function getWindow(state: WindowManagerState, app: AppId): WindowState | undefined {
  return state.windows.find((w) => w.app === app);
}

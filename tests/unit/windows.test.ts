import { describe, expect, it } from "vitest";
import {
  MENUBAR_H,
  MIN_H,
  MIN_W,
  VISIBLE_GRIP,
  clampGeometry,
  initialWindowState,
  windowReducer,
  type WindowAction,
  type WindowManagerState,
} from "@/os/state/windows";

const vp = { w: 1440, h: 900 };
const run = (actions: WindowAction[], start: WindowManagerState = initialWindowState(vp)) => actions.reduce(windowReducer, start);
const win = (s: WindowManagerState, app: string) => s.windows.find((w) => w.app === app)!;

describe("window manager reducer", () => {
  it("opens a window and focuses it", () => {
    const s = run([{ type: "open", app: "projects" }]);
    expect(s.windows).toHaveLength(1);
    expect(s.focusedId).toBe("win-projects");
    expect(win(s, "projects").minimized).toBe(false);
  });

  it("keeps a single instance per app and updates its params", () => {
    const s = run([
      { type: "open", app: "projects" },
      { type: "open", app: "about" },
      { type: "open", app: "projects", params: { slug: "journex" } },
    ]);
    expect(s.windows).toHaveLength(2);
    expect(s.focusedId).toBe("win-projects");
    expect(win(s, "projects").params.slug).toBe("journex");
  });

  it("stacks the focused window on top", () => {
    const s = run([
      { type: "open", app: "projects" },
      { type: "open", app: "about" },
      { type: "focus", id: "win-projects" },
    ]);
    expect(win(s, "projects").z).toBeGreaterThan(win(s, "about").z);
    expect(s.focusedId).toBe("win-projects");
  });

  it("closing the focused window focuses the next visible window", () => {
    const s = run([
      { type: "open", app: "projects" },
      { type: "open", app: "about" },
      { type: "close", id: "win-about" },
    ]);
    expect(s.windows.map((w) => w.app)).toEqual(["projects"]);
    expect(s.focusedId).toBe("win-projects");
  });

  it("closing the last window leaves nothing focused", () => {
    const s = run([{ type: "open", app: "projects" }, { type: "close", id: "win-projects" }]);
    expect(s.focusedId).toBeNull();
    expect(s.windows).toHaveLength(0);
  });

  it("closing an unknown window is a no-op", () => {
    const start = run([{ type: "open", app: "projects" }]);
    expect(windowReducer(start, { type: "close", id: "win-nope" })).toBe(start);
  });

  it("minimize moves focus and restore brings the window back on top", () => {
    let s = run([
      { type: "open", app: "projects" },
      { type: "open", app: "about" },
      { type: "minimize", id: "win-about" },
    ]);
    expect(win(s, "about").minimized).toBe(true);
    expect(s.focusedId).toBe("win-projects");
    s = windowReducer(s, { type: "restore", id: "win-about" });
    expect(win(s, "about").minimized).toBe(false);
    expect(s.focusedId).toBe("win-about");
    expect(win(s, "about").z).toBeGreaterThan(win(s, "projects").z);
  });

  it("re-opening a minimized app restores it", () => {
    const s = run([{ type: "open", app: "skills" }, { type: "minimize", id: "win-skills" }, { type: "open", app: "skills" }]);
    expect(win(s, "skills").minimized).toBe(false);
    expect(s.focusedId).toBe("win-skills");
  });

  it("toggleMaximize flips state and keeps the previous geometry", () => {
    let s = run([{ type: "open", app: "about" }]);
    const { x, y, w, h } = win(s, "about");
    s = windowReducer(s, { type: "toggleMaximize", id: "win-about" });
    expect(win(s, "about").maximized).toBe(true);
    s = windowReducer(s, { type: "toggleMaximize", id: "win-about" });
    expect(win(s, "about")).toMatchObject({ maximized: false, x, y, w, h });
  });

  it("moving a maximized window un-maximizes it", () => {
    const s = run([{ type: "open", app: "about" }, { type: "toggleMaximize", id: "win-about" }, { type: "move", id: "win-about", x: 300, y: 200 }]);
    expect(win(s, "about")).toMatchObject({ maximized: false, x: 300, y: 200 });
  });

  it("snap places windows on the left and right halves", () => {
    const left = run([{ type: "open", app: "about" }, { type: "snap", id: "win-about", side: "left" }]);
    expect(win(left, "about").x).toBe(8);
    const right = run([{ type: "open", app: "about" }, { type: "snap", id: "win-about", side: "right" }]);
    const r = win(right, "about");
    expect(r.x + r.w).toBe(vp.w - 8);
  });

  it("minimizeAll clears focus and closeAll removes windows", () => {
    let s = run([{ type: "open", app: "about" }, { type: "open", app: "skills" }, { type: "minimizeAll" }]);
    expect(s.focusedId).toBeNull();
    expect(s.windows.every((w) => w.minimized)).toBe(true);
    s = windowReducer(s, { type: "closeAll" });
    expect(s.windows).toHaveLength(0);
  });

  it("cycleFocus rotates through visible windows", () => {
    const s = run([{ type: "open", app: "about" }, { type: "open", app: "skills" }, { type: "cycleFocus", direction: 1 }]);
    expect(s.focusedId).toBe("win-about");
    const back = windowReducer(s, { type: "cycleFocus", direction: -1 });
    expect(back.focusedId).toBe("win-skills");
  });

  it("marks automatically opened windows, and clears the mark when opened explicitly", () => {
    let s = run([{ type: "open", app: "home", auto: true }]);
    expect(win(s, "home").auto).toBe(true);
    s = windowReducer(s, { type: "open", app: "home" });
    expect(win(s, "home").auto).toBe(false);
  });
});

describe("off-screen protection", () => {
  it("keeps the title bar reachable when dragged too far in any direction", () => {
    const base = run([{ type: "open", app: "about" }]);
    const w = win(base, "about").w;
    const farRight = windowReducer(base, { type: "move", id: "win-about", x: 99999, y: 200 });
    expect(win(farRight, "about").x).toBe(vp.w - VISIBLE_GRIP);
    const farLeft = windowReducer(base, { type: "move", id: "win-about", x: -99999, y: 200 });
    expect(win(farLeft, "about").x).toBe(VISIBLE_GRIP - w);
    const above = windowReducer(base, { type: "move", id: "win-about", x: 100, y: -500 });
    expect(win(above, "about").y).toBe(MENUBAR_H);
    const below = windowReducer(base, { type: "move", id: "win-about", x: 100, y: 99999 });
    expect(win(below, "about").y).toBeLessThan(vp.h);
  });

  it("enforces a minimum and maximum size", () => {
    const g = clampGeometry({ x: 0, y: 100, w: 10, h: 10 }, vp);
    expect(g.w).toBe(MIN_W);
    expect(g.h).toBe(MIN_H);
    const big = clampGeometry({ x: 0, y: 100, w: 99999, h: 99999 }, vp);
    expect(big.w).toBeLessThanOrEqual(vp.w);
    expect(big.h).toBeLessThanOrEqual(vp.h);
  });

  it("re-clamps every window when the viewport shrinks", () => {
    let s = run([{ type: "open", app: "projects" }, { type: "move", id: "win-projects", x: 1300, y: 700 }]);
    s = windowReducer(s, { type: "viewport", viewport: { w: 800, h: 500 } });
    const w = win(s, "projects");
    expect(w.x).toBeLessThanOrEqual(800 - VISIBLE_GRIP);
    expect(w.y).toBeLessThan(500);
    expect(w.w).toBeLessThanOrEqual(800);
  });

  it("opens new windows inside the viewport, cascading so they do not stack exactly", () => {
    const s = run([{ type: "open", app: "about" }, { type: "open", app: "skills" }, { type: "open", app: "education" }]);
    for (const w of s.windows) {
      expect(w.x).toBeGreaterThanOrEqual(0);
      expect(w.y).toBeGreaterThanOrEqual(MENUBAR_H);
      expect(w.x + w.w).toBeLessThanOrEqual(vp.w);
    }
    expect(new Set(s.windows.map((w) => w.y)).size).toBeGreaterThan(1);
  });
});

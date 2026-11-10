"use client";

import { ChevronLeft, Maximize2, Minimize2, Minus, X } from "lucide-react";
import * as m from "motion/react-m";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "./state/prefs";
import type { WindowState } from "./state/windows";
import { isHydrated, useOS, windowTitle } from "./OSContext";

const STEP = 24;

export function Window({ win, focused, children }: { win: WindowState; focused: boolean; children: ReactNode }) {
  const { store, close, minimize, focus, goHome } = useOS();
  const reduced = useReducedMotion();
  const [animateIn] = useState(() => isHydrated());
  const outer = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "move" | "resize"; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number }; pointer: number } | null>(null);
  const title = windowTitle(win);
  const titleId = `${win.id}-title`;

  const setVars = (g: { x?: number; y?: number; w?: number; h?: number }) => {
    const el = outer.current;
    if (!el) return;
    if (g.x !== undefined) el.style.setProperty("--x", `${g.x}px`);
    if (g.y !== undefined) el.style.setProperty("--y", `${g.y}px`);
    if (g.w !== undefined) el.style.setProperty("--w", `${g.w}px`);
    if (g.h !== undefined) el.style.setProperty("--h", `${g.h}px`);
  };

  const startDrag = (e: PointerEvent<HTMLElement>, kind: "move" | "resize") => {
    if (e.button !== 0 || window.matchMedia("(max-width: 767px)").matches) return;
    if (kind === "move" && (e.target as HTMLElement).closest("button")) return;
    const state = store.getState().wm.windows.find((w) => w.id === win.id);
    if (!state) return;
    focus(win.id);
    let orig = { x: state.x, y: state.y, w: state.w, h: state.h };
    if (state.maximized && kind === "move") {
      // Un-maximise under the pointer, keeping the grab point proportional.
      const ratio = (e.clientX - 8) / Math.max(1, window.innerWidth - 16);
      orig = { ...orig, x: Math.round(e.clientX - state.w * ratio), y: Math.max(34, e.clientY - 18) };
      store.dispatch({ type: "move", id: win.id, x: orig.x, y: orig.y });
    }
    drag.current = { kind, startX: e.clientX, startY: e.clientY, orig, pointer: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.kind === "move") setVars({ x: d.orig.x + dx, y: Math.max(34, d.orig.y + dy) });
    else setVars({ w: Math.max(360, d.orig.w + dx), h: Math.max(260, d.orig.h + dy) });
  };

  const endDrag = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.kind === "move") store.dispatch({ type: "move", id: win.id, x: d.orig.x + dx, y: d.orig.y + dy });
    else store.dispatch({ type: "resize", id: win.id, w: d.orig.w + dx, h: d.orig.h + dy });
    // The store clamps; write the clamped geometry back so the DOM matches state.
    const s = store.getState().wm.windows.find((w) => w.id === win.id);
    if (s) setVars(s);
  };

  const onHandleKey = (e: KeyboardEvent<HTMLElement>, kind: "move" | "resize") => {
    const s = store.getState().wm.windows.find((w) => w.id === win.id);
    if (!s) return;
    const delta = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key];
    if (!delta) return;
    e.preventDefault();
    if (kind === "move") store.dispatch({ type: "move", id: win.id, x: s.x + delta[0]!, y: s.y + delta[1]! });
    else store.dispatch({ type: "resize", id: win.id, w: s.w + delta[0]!, h: s.h + delta[1]! });
  };

  const style = { "--x": `${win.x}px`, "--y": `${win.y}px`, "--w": `${win.w}px`, "--h": `${win.h}px`, zIndex: 10 + win.z } as CSSProperties;

  return (
    <div
      ref={outer}
      data-window
      data-window-id={win.id}
      data-app={win.app}
      data-focused={focused ? "true" : "false"}
      data-minimized={win.minimized ? "true" : "false"}
      data-maximized={win.maximized ? "true" : "false"}
      data-auto={win.auto ? "true" : "false"}
      style={style}
      inert={win.minimized}
      aria-hidden={win.minimized || undefined}
      onPointerDownCapture={() => !focused && focus(win.id)}
      className="max-md:z-30!"
    >
      <m.section
        aria-labelledby={titleId}
        className={cn(
          "glass glass-edge flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-window)] shadow-[var(--shadow-window)] max-md:rounded-none max-md:border-0",
          !focused && "opacity-[0.97]",
        )}
        data-anim={animateIn && !reduced ? "in" : undefined}
        style={{ transformOrigin: "50% 100%" }}
        initial={reduced || !animateIn ? false : { opacity: 0, scale: 0.9, y: 36 }}
        animate={win.minimized ? { opacity: 0, scale: 0.86, y: 80 } : { opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30, mass: 0.85 }}
      >
        {/* Desktop title bar */}
        <header
          className="flex h-11 shrink-0 cursor-default items-center gap-3 border-b border-hairline px-3.5 select-none max-md:hidden"
          onPointerDown={(e) => startDrag(e, "move")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) store.dispatch({ type: "toggleMaximize", id: win.id });
          }}
        >
          <div className="group flex items-center" role="group" aria-label={`${title} window controls`}>
            <TrafficLight color="#ff5f57" label={`Close ${title}`} onClick={() => close(win.id)}>
              <X className="size-2.5" strokeWidth={3} />
            </TrafficLight>
            <TrafficLight color="#febc2e" label={`Minimize ${title}`} onClick={() => minimize(win.id)}>
              <Minus className="size-2.5" strokeWidth={3} />
            </TrafficLight>
            <TrafficLight
              color="#28c840"
              label={win.maximized ? `Restore ${title} size` : `Maximize ${title}`}
              onClick={() => store.dispatch({ type: "toggleMaximize", id: win.id })}
            >
              {win.maximized ? <Minimize2 className="size-2.5" strokeWidth={3} /> : <Maximize2 className="size-2.5" strokeWidth={3} />}
            </TrafficLight>
          </div>
          <h2
            id={titleId}
            tabIndex={0}
            data-window-focus
            aria-roledescription="window title"
            aria-describedby="window-move-hint"
            onKeyDown={(e) => onHandleKey(e, "move")}
            className="mx-auto truncate rounded-md px-2 text-[13.5px] font-semibold text-fg"
          >
            {title}
          </h2>
          <span className="w-[72px]" aria-hidden />
        </header>

        {/* Mobile navigation bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-2 pt-[env(safe-area-inset-top)] md:hidden">
          <button
            type="button"
            onClick={goHome}
            className="inline-flex h-10 items-center gap-0.5 rounded-lg pr-3 pl-1 text-[15px] font-medium text-accent-text"
          >
            <ChevronLeft className="size-5" aria-hidden />
            Home
          </button>
          <p className="truncate text-[15px] font-semibold text-fg" aria-hidden>
            {title}
          </p>
          <button type="button" onClick={() => close(win.id)} aria-label={`Close ${title}`} className="ml-auto inline-flex size-10 items-center justify-center rounded-lg text-muted">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="surface min-h-0 flex-1 overflow-hidden">{children}</div>

        <span
          role="button"
          tabIndex={0}
          aria-label={`Resize ${title}. Use arrow keys.`}
          onPointerDown={(e) => startDrag(e, "resize")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => onHandleKey(e, "resize")}
          className="absolute right-0 bottom-0 size-6 cursor-nwse-resize max-md:hidden"
          style={{ display: win.maximized ? "none" : undefined }}
        >
          <svg viewBox="0 0 20 20" className="size-full text-subtle" aria-hidden>
            <path d="M15 9v6H9M15 13v2h-2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </m.section>
    </div>
  );
}

function TrafficLight({ color, label, onClick, children }: { color: string; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-full"
    >
      <span className="grid size-3.5 place-items-center rounded-full text-black/60 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)]" style={{ background: color }}>
        <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{children}</span>
      </span>
    </button>
  );
}

"use client";

import { memo, useRef, useState, type KeyboardEvent } from "react";
import { AppIcon } from "@/design/icons/AppIcon";
import { cn } from "@/lib/cn";
import { APPS, DOCK_APPS, type AppId } from "./apps";
import { useOS, useOSState } from "./OSContext";
import { usePrefs, useReducedMotion } from "./state/prefs";

const SIZES = { small: 44, medium: 52, large: 62 } as const;
const MemoIcon = memo(AppIcon);

export function Dock() {
  const { open, store } = useOS();
  const prefs = usePrefs();
  const reduced = useReducedMotion();
  const magnify = prefs.dockMagnify && !reduced;
  const viewportW = useOSState((s) => s.wm.viewport.w);
  const [pointer, setPointer] = useState<{ x: number; centers: number[] } | null>(null);
  const frame = useRef(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const running = useOSState(
    (s) => s.wm.windows.map((w) => `${w.app}:${w.minimized ? 0 : 1}:${s.wm.focusedId === w.id ? 1 : 0}`).join("|"),
  );
  const state = new Map(
    running
      .split("|")
      .filter(Boolean)
      .map((entry) => {
        const [app, visible, focused] = entry.split(":");
        return [app as AppId, { visible: visible === "1", focused: focused === "1" }];
      }),
  );

  const items: Array<AppId | "spotlight" | "sep"> = [...DOCK_APPS.slice(0, 14), "sep", ...DOCK_APPS.slice(14), "spotlight"];
  const focusable = items.filter((i) => i !== "sep");
  // Shrink to fit narrow desktops so the dock never overflows the screen.
  const fit = Math.floor((viewportW - 120) / focusable.length) - 6;
  const base = Math.max(34, Math.min(SIZES[prefs.dockSize], fit));

  const onMove = (x: number) => {
    if (!magnify) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const centers = buttons.current.map((b) => {
        if (!b) return 0;
        const r = b.getBoundingClientRect();
        return r.left + r.width / 2;
      });
      setPointer({ x, centers });
    });
  };

  const scaleFor = (index: number) => {
    if (!magnify || pointer === null) return 1;
    const center = pointer.centers[index];
    if (center === undefined) return 1;
    const d = Math.abs(pointer.x - center) / (base * 2.4);
    return 1 + 0.5 * Math.max(0, 1 - d * d);
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = focusable.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next >= 0) {
      e.preventDefault();
      buttons.current[next]?.focus();
    }
  };

  let focusIndex = -1;
  return (
    <nav aria-label="Dock" className="fixed bottom-2.5 left-1/2 z-40 -translate-x-1/2 max-md:hidden">
      <div
        role="toolbar"
        aria-label="Applications"
        aria-orientation="horizontal"
        className="glass glass-edge flex items-end gap-1.5 rounded-[22px] px-2.5 pt-2 pb-2 shadow-[var(--shadow-float)]"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setPointer(null)}
      >
        {items.map((item, i) => {
          if (item === "sep") return <span key={`sep-${i}`} aria-hidden className="mx-0.5 mb-1.5 h-9 w-px self-center bg-hairline-strong" />;
          focusIndex += 1;
          const idx = focusIndex;
          const app = item;
          const isSpotlight = app === "spotlight";
          const st = isSpotlight ? undefined : state.get(app);
          const scale = scaleFor(idx);
          const label = isSpotlight ? "Spotlight search" : APPS[app].title;
          return (
            <div key={app} className="group relative flex flex-col items-center">
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 rounded-lg border border-hairline bg-raised px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-fg opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                style={{ transform: `translateY(${-(scale - 1) * base}px)` }}
              >
                {label}
              </span>
              <button
                ref={(el) => {
                  buttons.current[idx] = el;
                }}
                type="button"
                aria-label={st ? `${label} (open)` : label}
                tabIndex={idx === 0 ? 0 : -1}
                onKeyDown={(e) => onKeyDown(e, idx)}
                onClick={(e) => {
                  if (isSpotlight) store.dispatch({ type: "spotlight", open: true });
                  else open(app, undefined, { trigger: e.currentTarget });
                }}
                className={cn(
                  "block origin-bottom rounded-[14px] transition-transform duration-150 ease-out active:brightness-90",
                  !magnify && "hover:-translate-y-1.5",
                )}
                style={{ width: base, height: base, transform: magnify ? `scale(${scale})` : undefined, marginInline: magnify ? (scale - 1) * base * 0.5 : undefined }}
              >
                <span key={st ? "open" : "closed"} className={st ? "dock-launch" : "block"}>
                  <MemoIcon app={app} size={base} />
                </span>
              </button>
              <span
                aria-hidden
                className={cn(
                  "mt-1 size-1 rounded-full transition-opacity",
                  st ? "opacity-100" : "opacity-0",
                  st?.focused ? "bg-fg" : "bg-muted",
                )}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}

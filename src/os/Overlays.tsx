"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppIcon } from "@/design/icons/AppIcon";
import { cn } from "@/lib/cn";
import { DOCK_APPS } from "./apps";
import { LogoMark, useIsMac } from "./MenuBar";
import { useOS, useOSState, windowTitle } from "./OSContext";
import { WALLPAPERS, setPrefs } from "./state/prefs";
import { useModalDialog } from "./useDialog";

// ---------------------------------------------------------------------------
// Boot screen — rendered on the server; CSS fades it out even without JS.
// ---------------------------------------------------------------------------
function timeGreeting() {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const noSubscribe = () => () => {};

export function BootScreen() {
  const [done, setDone] = useState(false);
  const greeting = useSyncExternalStore(noSubscribe, timeGreeting, () => "Welcome");
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("shivam-os:booted", "1");
    } catch {
      // Storage unavailable: the boot screen simply shows again next visit.
    }
    const t = setTimeout(() => setDone(true), 2100);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;
  const skip = () => {
    if (dontShow) setPrefs({ showBoot: false });
    setDone(true);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-window-focus]")?.focus({ preventScroll: true }));
  };

  return (
    <div className="boot" data-done={done} role="status" aria-label="SHIVAM.OS is starting">
      <div className="flex flex-col items-center gap-5 text-center">
        <LogoMark className="size-16 drop-shadow-[0_10px_30px_rgba(110,150,255,0.45)]" />
        <div>
          <p className="font-display text-[28px] font-semibold tracking-tight">SHIVAM.OS</p>
          <p className="mt-1 text-[15px] text-white/70">
            {greeting} — you&apos;re viewing Shivam Patil&apos;s engineering portfolio.
          </p>
        </div>
        <div className="boot-bar h-1 w-48 overflow-hidden rounded-full bg-white/15">
          <span />
        </div>
        <div className="mt-2 flex items-center gap-4 text-[13px]">
          <button type="button" onClick={skip} className="rounded-full border border-white/25 px-4 py-1.5 font-medium text-white hover:bg-white/10">
            Skip intro
          </button>
          <label className="inline-flex items-center gap-2 text-white/70">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="size-4 accent-[#7fb0ff]" />
            Don&apos;t show again
          </label>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Window overview
// ---------------------------------------------------------------------------
export function Overview() {
  const openState = useOSState((s) => s.overviewOpen);
  if (!openState) return null;
  return <OverviewDialog />;
}

function OverviewDialog() {
  const { store, focus, close } = useOS();
  const windows = useOSState((s) => [...s.wm.windows].sort((a, b) => b.z - a.z));
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = () => store.dispatch({ type: "overview", open: false });
  useModalDialog(ref, true, dismiss);
  return (
    <div className="fixed inset-0 z-[58] bg-black/45 backdrop-blur-md" onPointerDown={(e) => e.target === e.currentTarget && dismiss()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="overview-title" className="mx-auto mt-[12vh] max-w-5xl px-6">
        <div className="mb-5 flex items-center justify-between text-white">
          <h2 id="overview-title" className="font-display text-2xl font-semibold">
            Open windows
          </h2>
          <button type="button" onClick={dismiss} className="rounded-full p-2 hover:bg-white/10" aria-label="Close overview">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {windows.length === 0 ? (
          <p className="text-white/80">No windows are open. Open an app from the dock or press Ctrl/⌘ K.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {windows.map((w) => (
              <li key={w.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    focus(w.id);
                    dismiss();
                  }}
                  className="glass glass-edge flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <AppIcon app={w.app} size={48} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-fg">{windowTitle(w)}</span>
                    <span className="block text-[13px] text-muted">{w.minimized ? "Minimized" : w.id === store.getState().wm.focusedId ? "Focused" : "Open"}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => close(w.id)}
                  aria-label={`Close ${windowTitle(w)}`}
                  className="absolute top-2 right-2 rounded-full bg-black/40 p-1 text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop context menu
// ---------------------------------------------------------------------------
export function DesktopContextMenu() {
  const at = useOSState((s) => s.contextMenu);
  if (!at) return null;
  return <ContextMenuPanel key={`${at.x}:${at.y}`} at={at} />;
}

function ContextMenuPanel({ at }: { at: { x: number; y: number } }) {
  const { store, open } = useOS();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const dismiss = () => store.dispatch({ type: "contextMenu", at: null });

  const items: Array<{ label: string; run: () => void }> = [
    { label: "Search everything…", run: () => store.dispatch({ type: "spotlight", open: true }) },
    { label: "Window overview", run: () => store.dispatch({ type: "overview", open: true }) },
    { label: "Change wallpaper", run: () => setPrefs({ wallpaper: WALLPAPERS[(WALLPAPERS.indexOf((document.documentElement.dataset.wallpaper ?? "aurora") as (typeof WALLPAPERS)[number]) + 1) % WALLPAPERS.length]! }) },
    { label: "Settings…", run: () => open("settings") },
    { label: "Minimize all windows", run: () => store.dispatch({ type: "minimizeAll" }) },
    { label: "Close all windows", run: () => store.dispatch({ type: "closeAll" }) },
  ];

  useEffect(() => {
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) store.dispatch({ type: "contextMenu", at: null });
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [store]);

  const x = Math.min(at.x, window.innerWidth - 240);
  const y = Math.min(at.y, window.innerHeight - 260);
  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Desktop"
      className="glass glass-edge fixed z-[57] w-56 rounded-xl p-1.5 shadow-[var(--shadow-float)]"
      style={{ left: x, top: y }}
      onKeyDown={(e) => {
        const n = items.length;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = (active + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
          setActive(next);
          ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[next]?.focus();
        } else if (e.key === "Escape" || e.key === "Tab") {
          e.preventDefault();
          dismiss();
          document.querySelector<HTMLElement>("[data-desktop-focus]")?.focus();
        }
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          tabIndex={i === active ? 0 : -1}
          onClick={() => {
            dismiss();
            it.run();
          }}
          className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg outline-none focus:bg-accent-strong focus:text-white"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------
export function ShortcutsDialog() {
  const openState = useOSState((s) => s.shortcutsOpen);
  if (!openState) return null;
  return <ShortcutsInner />;
}

function ShortcutsInner() {
  const { store } = useOS();
  const isMac = useIsMac();
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = () => store.dispatch({ type: "shortcuts", open: false });
  useModalDialog(ref, true, dismiss);
  const mod = isMac ? "⌘" : "Ctrl";
  const alt = isMac ? "⌥ ⇧" : "Alt + Shift +";
  const rows: Array<[string, string]> = [
    [`${mod} K`, "Open Spotlight search"],
    ["Esc", "Close Spotlight, menus and dialogs"],
    [`${alt} W`, "Close the focused window"],
    [`${alt} M`, "Minimize the focused window"],
    [`${alt} F`, "Maximize / restore the focused window"],
    [`${alt} ← / →`, "Snap the focused window left / right"],
    [`${alt} \``, "Cycle through open windows"],
    [`${alt} O`, "Window overview"],
    [`${alt} 1–9`, `Open dock apps (${DOCK_APPS.slice(0, 3).join(", ")}, …)`],
    [`${alt} ?`, "Show this list"],
    ["Arrow keys", "Move a window when its title is focused; resize from the corner handle"],
  ];
  return (
    <div className="fixed inset-0 z-[59] grid place-items-center bg-black/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && dismiss()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" className="glass glass-edge w-full max-w-lg rounded-2xl p-5 shadow-[var(--shadow-window)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="shortcuts-title" className="font-display text-lg font-semibold">
            Keyboard shortcuts
          </h2>
          <button type="button" onClick={dismiss} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-hover">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <dl className="divide-y divide-hairline">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-6 py-2 text-[13.5px]">
              <dt className="text-muted">{v}</dt>
              <dd>
                <kbd className={cn("rounded-md border border-hairline bg-sunken px-2 py-0.5 font-sans text-[12px] whitespace-nowrap text-fg")}>{k}</kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

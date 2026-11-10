"use client";

import { BriefcaseBusiness, Moon, Search, Sun, WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { APP_IDS, APPS } from "./apps";
import { MenuButton } from "./Menu";
import { useOS, useOSState, windowTitle } from "./OSContext";
import { useResolvedTheme } from "./state/prefs";
import { switchTheme } from "./themeTransition";

const CLOCK_MS = 15_000;

function useClock() {
  const tick = useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, CLOCK_MS);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / CLOCK_MS),
    () => 0,
  );
  return tick === 0 ? null : new Date(tick * CLOCK_MS);
}

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

export function useIsMac() {
  return useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

export function MenuBar() {
  const { open, store, close, minimize } = useOS();
  const now = useClock();
  const online = useOnline();
  const isMac = useIsMac();
  const mod = isMac ? "⌘" : "Ctrl";
  const alt = isMac ? "⌥⇧" : "Alt+Shift+";
  const focused = useOSState((s) => {
    const w = s.wm.windows.find((x) => x.id === s.wm.focusedId && !x.minimized);
    return w ? { id: w.id, title: windowTitle(w), maximized: w.maximized } : null;
  }, (a, b) => a?.id === b?.id && a?.title === b?.title && a?.maximized === b?.maximized);
  const dark = useResolvedTheme() === "dark";

  const time = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "";
  const date = now?.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) ?? "";

  return (
    <header className="glass fixed inset-x-0 top-0 z-40 flex h-[var(--menubar-h)] items-center gap-1 border-x-0 border-t-0 px-2 text-fg shadow-none md:px-3">
      <h1 className="sr-only">SHIVAM.OS — the developer portfolio of Shivam Patil</h1>

      {/* Mobile status bar */}
      <div className="flex w-full items-center md:hidden">
        <span className="w-20 text-[13px] font-semibold tabular-nums">{time}</span>
        <span className="flex-1 text-center text-[13px] font-semibold tracking-wide">SHIVAM.OS</span>
        <span className="flex w-20 justify-end">
          <button type="button" aria-label="Search" onClick={() => store.dispatch({ type: "spotlight", open: true })} className="inline-flex size-8 items-center justify-center rounded-md">
            <Search className="size-4" aria-hidden />
          </button>
        </span>
      </div>

      {/* Desktop menus */}
      <nav aria-label="Menu bar" className="flex items-center gap-0.5 max-md:hidden">
        <MenuButton
          label="SHIVAM.OS"
          className="font-semibold tracking-wide"
          items={[
            { label: "About Shivam", onSelect: () => open("about") },
            { label: "Recruiter Mode", onSelect: () => open("recruiter") },
            { label: "Settings…", onSelect: () => open("settings"), separatorBefore: true },
            { label: "Quality Control Center", onSelect: () => open("quality") },
            { label: "Keyboard shortcuts", shortcut: `${alt}?`, onSelect: () => store.dispatch({ type: "shortcuts", open: true }), separatorBefore: true },
            {
              label: "Reset desktop",
              onSelect: () => {
                store.dispatch({ type: "closeAll" });
                open("home", undefined, { silent: true });
              },
            },
          ]}
        >
          <LogoMark />
          <span className="ml-1.5">SHIVAM.OS</span>
        </MenuButton>
        <span className="px-2 text-[13px] font-semibold" aria-live="polite">
          {focused?.title ?? "Desktop"}
        </span>
        <MenuButton
          label="Apps"
          items={APP_IDS.map((id, i) => ({ label: APPS[id].title, onSelect: () => open(id), shortcut: i < 9 ? `${alt}${i + 1}` : undefined }))}
        >
          Apps
        </MenuButton>
        <MenuButton
          label="Window"
          items={[
            { label: "Minimize", shortcut: `${alt}M`, disabled: !focused, onSelect: () => focused && minimize(focused.id) },
            { label: focused?.maximized ? "Restore size" : "Maximize", shortcut: `${alt}F`, disabled: !focused, onSelect: () => focused && store.dispatch({ type: "toggleMaximize", id: focused.id }) },
            { label: "Snap left", shortcut: `${alt}←`, disabled: !focused, onSelect: () => focused && store.dispatch({ type: "snap", id: focused.id, side: "left" }) },
            { label: "Snap right", shortcut: `${alt}→`, disabled: !focused, onSelect: () => focused && store.dispatch({ type: "snap", id: focused.id, side: "right" }) },
            { label: "Close", shortcut: `${alt}W`, disabled: !focused, onSelect: () => focused && close(focused.id) },
            { label: "Window overview", shortcut: `${alt}O`, onSelect: () => store.dispatch({ type: "overview", open: true }), separatorBefore: true },
            { label: "Cycle windows", shortcut: `${alt}\``, onSelect: () => store.dispatch({ type: "cycleFocus", direction: 1 }) },
            { label: "Minimize all", onSelect: () => store.dispatch({ type: "minimizeAll" }) },
          ]}
        >
          Window
        </MenuButton>
        <MenuButton
          label="Help"
          items={[
            { label: "Search everything", shortcut: `${mod}K`, onSelect: () => store.dispatch({ type: "spotlight", open: true }) },
            { label: "Keyboard shortcuts", shortcut: `${alt}?`, onSelect: () => store.dispatch({ type: "shortcuts", open: true }) },
            { label: "Open Terminal", onSelect: () => open("terminal") },
          ]}
        >
          Help
        </MenuButton>
      </nav>

      <div className="ml-auto flex items-center gap-1 max-md:hidden">
        <button
          type="button"
          onClick={() => open("recruiter")}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 text-[12.5px] font-medium text-accent-text transition-colors hover:brightness-110"
        >
          <BriefcaseBusiness className="size-3.5" aria-hidden />
          Recruiter Mode
        </button>
        {!online && (
          <span className="inline-flex h-7 items-center gap-1 px-2 text-[12.5px] text-warning" role="status">
            <WifiOff className="size-3.5" aria-hidden /> Offline
          </span>
        )}
        <button
          type="button"
          onClick={() => store.dispatch({ type: "spotlight", open: true })}
          className="inline-flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] text-muted hover:bg-hover hover:text-fg"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="sr-only">Search</span>
          <kbd className="font-sans">{mod} K</kbd>
        </button>
        <button
          type="button"
          onClick={(e) => switchTheme(dark ? "light" : "dark", e.currentTarget)}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-fg"
        >
          <Sun className="hidden size-4 dark:block" aria-hidden />
          <Moon className="size-4 dark:hidden" aria-hidden />
        </button>
        <time className="min-w-[132px] px-2 text-right text-[12.5px] font-medium tabular-nums" dateTime={now?.toISOString()}>
          {date} {time}
        </time>
      </div>
    </header>
  );
}

export function LogoMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fb0ff" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#logo-g)" />
      <path d="M15.5 8.6c-.7-.9-1.9-1.4-3.3-1.4-2 0-3.4 1-3.4 2.5 0 3.4 6.9 1.9 6.9 5.2 0 1.6-1.5 2.7-3.6 2.7-1.6 0-2.9-.6-3.6-1.7" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

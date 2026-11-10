"use client";

import { AlertTriangle, Check, CheckCircle2, Copy, Info, Loader2, Search, SquareArrowOutUpRight } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useActivity, type ActivityKind } from "./state/activity";
import { useReducedMotion } from "./state/prefs";

const ICONS: Record<ActivityKind, typeof Check> = {
  opened: SquareArrowOutUpRight,
  search: Search,
  running: Loader2,
  completed: CheckCircle2,
  copied: Copy,
  error: AlertTriangle,
  info: Info,
};

const TONES: Record<ActivityKind, string> = {
  opened: "#7fb0ff",
  search: "#7fb0ff",
  running: "#c4b5fd",
  completed: "#3ddc84",
  copied: "#3ddc84",
  error: "#ff6b6b",
  info: "#7fb0ff",
};

/**
 * A compact activity indicator inspired by dynamic, pill-shaped status areas.
 * It only shows events the site actually performed, and mirrors them to a
 * polite live region for screen readers.
 */
export function ActivityPill() {
  const event = useActivity();
  const reduced = useReducedMotion();
  const Icon = event ? ICONS[event.kind] : Check;
  const announcement = event ? `${event.title}${event.detail ? `. ${event.detail}` : ""}` : "";

  return (
    <>
      <div className="pointer-events-none fixed top-[calc(var(--menubar-h)+8px)] left-1/2 z-[55] -translate-x-1/2" aria-hidden>
        <AnimatePresence>
          {event && (
            <m.div
              key={event.kind === "running" || event.kind === "completed" ? "task" : event.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: -10, borderRadius: 999 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: -8 }}
              transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 520, damping: 36 }}
              className="flex max-w-[min(92vw,420px)] items-center gap-2.5 rounded-full bg-black/90 py-2 pr-4 pl-2.5 text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: `${TONES[event.kind]}26`, color: TONES[event.kind] }}>
                <Icon className={event.kind === "running" ? "size-4 animate-spin" : "size-4"} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{event.title}</span>
                {event.detail && <span className="block truncate text-[11.5px] text-white/70">{event.detail}</span>}
              </span>
              {typeof event.progress === "number" && (
                <span className="ml-1 h-1 w-14 overflow-hidden rounded-full bg-white/15">
                  <span className="block h-full rounded-full bg-[#c4b5fd] transition-[width]" style={{ width: `${Math.round(event.progress * 100)}%` }} />
                </span>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </>
  );
}

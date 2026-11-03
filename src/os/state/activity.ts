import { useSyncExternalStore } from "react";

/**
 * Activity pill events. Only genuine application events are published here —
 * nothing simulates background work that is not happening.
 */
export type ActivityKind = "opened" | "search" | "running" | "completed" | "copied" | "error" | "info";

export interface ActivityEvent {
  id: number;
  kind: ActivityKind;
  title: string;
  detail?: string;
  /** 0–1 while a real task reports progress. */
  progress?: number;
  /** Persistent events (running) stay until replaced. */
  sticky?: boolean;
  at: number;
}

let current: ActivityEvent | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const DURATION: Record<ActivityKind, number> = {
  opened: 2200,
  search: 2400,
  running: 0,
  completed: 4200,
  copied: 2000,
  error: 6000,
  info: 3000,
};

export function publishActivity(event: Omit<ActivityEvent, "id" | "at">): number {
  if (timer) clearTimeout(timer);
  seq += 1;
  current = { ...event, id: seq, at: Date.now() };
  const ttl = event.sticky ? 0 : DURATION[event.kind];
  if (ttl > 0) {
    const id = seq;
    timer = setTimeout(() => {
      if (current?.id === id) {
        current = null;
        emit();
      }
    }, ttl);
  }
  emit();
  return seq;
}

export function clearActivity(id?: number) {
  if (id !== undefined && current?.id !== id) return;
  current = null;
  emit();
}

export function useActivity(): ActivityEvent | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}

export async function copyText(text: string, label: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    publishActivity({ kind: "copied", title: `${label} copied` });
    return true;
  } catch {
    publishActivity({ kind: "error", title: "Couldn't copy", detail: "Your browser blocked clipboard access." });
    return false;
  }
}

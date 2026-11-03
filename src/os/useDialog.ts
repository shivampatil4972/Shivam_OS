"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog behaviour: traps Tab inside `ref`, closes on Escape, and
 * returns focus to whatever was focused before it opened.
 */
export function useModalDialog(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const previous = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE) ?? ref.current;
      target?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = index === -1 ? 0 : (index + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next]!.focus();
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
      const prev = previous.current;
      if (prev && document.body.contains(prev)) {
        requestAnimationFrame(() => {
          // If an action from the dialog moved focus somewhere on purpose (e.g. into a window), keep it there.
          const active = document.activeElement;
          if (active && active !== document.body && active !== prev) return;
          prev.focus({ preventScroll: true });
        });
      }
    };
  }, [open, ref, initialFocus]);
}

"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  shortcut?: string;
  disabled?: boolean;
  separatorBefore?: boolean;
}

/** WAI-ARIA menu button: arrow keys move, Enter/Space select, Escape closes and restores focus. */
export function MenuButton({
  label,
  children,
  items,
  className,
  menuClassName,
  align = "left",
}: {
  label: string;
  children: ReactNode;
  items: MenuItem[];
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const close = (restore = true) => {
    setOpen(false);
    if (restore) button.current?.focus();
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(enabled[0] ?? 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(enabled[enabled.length - 1] ?? 0);
    }
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const pos = enabled.indexOf(active);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(enabled[(pos + 1) % enabled.length]!);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(enabled[(pos - 1 + enabled.length) % enabled.length]!);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(enabled[0]!);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(enabled[enabled.length - 1]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `menu-${id}` : undefined}
        onClick={() => (open ? close(false) : openAt(enabled[0] ?? 0))}
        onKeyDown={onButtonKey}
        className={cn("inline-flex h-7 items-center rounded-md px-2 text-[13px] transition-colors hover:bg-hover aria-expanded:bg-hover", className)}
      >
        {children}
        <span className="sr-only"> menu</span>
      </button>
      {open && (
        <div
          ref={menu}
          id={`menu-${id}`}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={cn(
            "glass glass-edge absolute top-[calc(100%+6px)] z-50 min-w-56 rounded-xl p-1.5 shadow-[var(--shadow-float)]",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {items.map((it, i) => (
            <div key={it.label}>
              {it.separatorBefore && <div role="separator" className="my-1 h-px bg-hairline" />}
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={i === active ? 0 : -1}
                disabled={it.disabled}
                onClick={() => {
                  close(false);
                  it.onSelect();
                }}
                onPointerEnter={() => !it.disabled && setActive(i)}
                className="flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg outline-none focus:bg-accent-strong focus:text-white disabled:opacity-40"
              >
                <span>{it.label}</span>
                {it.shortcut && <kbd className="font-sans text-[11.5px] opacity-70">{it.shortcut}</kbd>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

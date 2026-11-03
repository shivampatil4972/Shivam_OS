"use client";

import { ExternalLink as ExternalIcon, PencilLine } from "lucide-react";
import {
  forwardRef,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { isPlaceholder, stripPlaceholder } from "@/content/placeholder";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent-strong text-white hover:brightness-110 shadow-[0_6px_18px_-6px_var(--accent)]",
  secondary: "bg-sunken text-fg border border-hairline hover:bg-hover",
  ghost: "text-fg hover:bg-hover",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }>(
  function Button({ variant = "secondary", size = "md", className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-[filter,background-color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
  external,
  download,
  onClick,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
  download?: string | boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const isExternal = external ?? /^https?:/.test(href);
  return (
    <a
      href={href}
      onClick={onClick}
      download={download}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium no-underline transition-[filter,background-color] duration-150",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variants[variant],
        className,
      )}
    >
      {children}
      {isExternal && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1 text-accent-text underline decoration-accent/40 underline-offset-2 hover:decoration-accent", className)}
    >
      {children}
      <ExternalIcon aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info"; className?: string }) {
  const tones = {
    neutral: "bg-sunken text-muted border-hairline",
    accent: "bg-accent-soft text-accent-text border-accent/30",
    success: "bg-success/12 text-success border-success/30",
    warning: "bg-warning/12 text-warning border-warning/30",
    danger: "bg-danger/12 text-danger border-danger/30",
    info: "bg-info/12 text-info border-info/30",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Chip({ children, active, onClick, className }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  if (!onClick) {
    return <span className={cn("inline-flex items-center rounded-md border border-hairline bg-sunken px-2 py-0.5 text-[12px] text-muted", className)}>{children}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-left text-[13px] leading-tight transition-colors",
        active ? "border-accent/50 bg-accent-soft text-accent-text" : "border-hairline bg-sunken text-muted hover:bg-hover hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Renders text; placeholder content is shown as a clearly marked editable placeholder. */
export function Txt({ children, className }: { children: string; className?: string }) {
  if (!isPlaceholder(children)) return <span className={className}>{children}</span>;
  return (
    <span
      className={cn("inline-flex items-start gap-1.5 rounded-md border border-dashed border-warning/50 bg-warning/8 px-1.5 py-0.5 text-[0.92em] text-warning", className)}
      title="Editable placeholder — this detail has not been verified yet"
    >
      <PencilLine aria-hidden className="mt-[3px] size-3.5 shrink-0" />
      <span>
        <span className="sr-only">Placeholder: </span>
        {stripPlaceholder(children)}
      </span>
    </span>
  );
}

export function SectionTitle({ children, eyebrow, id, as: As = "h2" }: { children: ReactNode; eyebrow?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className="mb-3">
      {eyebrow && <p className="mb-1 text-[11.5px] font-semibold tracking-[0.08em] text-subtle uppercase">{eyebrow}</p>}
      <As id={id} className={cn("font-display font-semibold text-fg", As === "h2" ? "text-xl" : "text-base")}>
        {children}
      </As>
    </div>
  );
}

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

/** WAI-ARIA tabs with roving focus (arrow keys, Home, End). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
  idBase,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
  idBase?: string;
}) {
  const auto = useId();
  const base = idBase ?? `tabs${auto.replace(/[^a-zA-Z0-9]/g, "")}`;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next >= 0) {
      e.preventDefault();
      onChange(items[next]!.id);
      refs.current[next]?.focus();
    }
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto rounded-[12px] bg-sunken p-1", className)}>
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
              selected ? "bg-raised text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, id, children, className }: { idBase: string; id: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${id}`} aria-labelledby={`${idBase}-tab-${id}`} tabIndex={0} className={cn("outline-none", className)}>
      {children}
    </div>
  );
}

/** A labelled radio group styled as a segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  name,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
  name: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-[12px] bg-sunken p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "relative inline-flex h-8 cursor-pointer items-center rounded-[9px] px-3 text-[13px] font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent-ring)]",
              value === o.value ? "bg-raised text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <p className="text-[13px] text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-accent-strong" : "bg-hairline-strong")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-3">
      <dt className="text-[12px] text-subtle">{label}</dt>
      <dd className="font-display text-lg font-semibold text-fg">{value}</dd>
      {hint && <dd className="mt-0.5 text-[12px] text-muted">{hint}</dd>}
    </div>
  );
}

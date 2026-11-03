"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { categoryLabels, statusLabels } from "@/content/projects";
import type { Project } from "@/content/schema";
import { Badge, Txt } from "@/design/ui";
import { cn } from "@/lib/cn";

export function AppScroll({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="scroll-area h-full" tabIndex={0}>
      <div className={cn("mx-auto w-full px-5 py-5 md:px-7 md:py-6", wide ? "max-w-6xl" : "max-w-4xl", className)}>{children}</div>
    </div>
  );
}

export function AppHeading({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="font-display text-2xl font-semibold text-fg">{title}</h3>
        {subtitle && <p className="mt-1 max-w-2xl text-[14px] text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const STATUS_TONE: Record<Project["status"], "success" | "accent" | "info" | "warning"> = {
  completed: "success",
  "in-development": "accent",
  hackathon: "info",
  "early-build": "warning",
};

export function ProjectStatus({ project }: { project: Project }) {
  return <Badge tone={STATUS_TONE[project.status]}>{statusLabels[project.status]}</Badge>;
}

export function ProjectCover({ project, className, sizes = "(max-width: 768px) 100vw, 400px", priority }: { project: Project; className?: string; sizes?: string; priority?: boolean }) {
  const cover = project.media.cover;
  if (!cover) {
    return (
      <div className={cn("relative grid place-items-center overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,var(--accent-soft),transparent_60%),linear-gradient(135deg,var(--surface-raised),var(--surface-solid))]", className)} aria-hidden>
        <span className="font-display text-3xl font-semibold text-fg/80">{project.title.split(/[\s(—]/)[0]}</span>
        <span className="absolute bottom-2 left-3 text-[11px] text-subtle">{categoryLabels[project.category]}</span>
      </div>
    );
  }
  // Charts and figures must never be cropped; screenshots fill the frame from the top.
  const isFigure = cover.src.startsWith("/research/");
  return (
    <div className={cn("relative overflow-hidden", isFigure ? "bg-white" : "bg-raised", className)}>
      <Image src={cover.src} alt={cover.alt} fill sizes={sizes} className={isFigure ? "object-contain p-2" : "object-cover object-top"} priority={priority} />
    </div>
  );
}

export function BulletList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed text-fg">
          <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
          <Txt>{item}</Txt>
        </li>
      ))}
    </ul>
  );
}

export function Section({ title, children, id, eyebrow }: { title: string; children: ReactNode; id?: string; eyebrow?: string }) {
  return (
    <section aria-labelledby={id} className="mt-7 first:mt-0">
      {eyebrow && <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-subtle uppercase">{eyebrow}</p>}
      <h4 id={id} className="mb-2.5 font-display text-[17px] font-semibold text-fg">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function formatMonth(ym: string): string {
  if (ym === "ongoing") return "Present";
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

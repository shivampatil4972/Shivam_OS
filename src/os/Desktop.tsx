"use client";

import { ArrowUpRight, BriefcaseBusiness, Download, FileText, FlaskConical, Mail, MapPin, Rocket } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent, MouseEvent } from "react";
import { AppIcon } from "@/design/icons/AppIcon";
import { profile } from "@/content/profile";
import { getProject } from "@/content/projects";
import { APP_IDS, APPS, MOBILE_DOCK_APPS, type AppId } from "./apps";
import { useOS } from "./OSContext";

const flagship = getProject("journex")!;
const flagshipTests = flagship.testing.suites.reduce((s, x) => s + (x.count ?? 0), 0);

export function Desktop() {
  const { open, store } = useOS();
  const onContext = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-window],button,a,input")) return;
    e.preventDefault();
    store.dispatch({ type: "contextMenu", at: { x: e.clientX, y: e.clientY } });
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      store.dispatch({ type: "contextMenu", at: { x: r.left + 120, y: r.top + 80 } });
    }
  };

  return (
    <div
      className="fixed inset-0 top-[var(--menubar-h)] outline-none max-md:hidden"
      onContextMenu={onContext}
      onKeyDown={onKey}
      tabIndex={-1}
      data-desktop-focus
      aria-label="Desktop"
      role="region"
    >
      <ul className="absolute top-4 left-4 flex flex-col gap-2" aria-label="Desktop shortcuts">
        {[
          { label: "Résumé.pdf", icon: <FileText className="size-7" aria-hidden />, run: (el: HTMLElement) => open("resume", undefined, { trigger: el }) },
          { label: "JOURNEX case study", icon: <Rocket className="size-7" aria-hidden />, run: (el: HTMLElement) => open("projects", { slug: "journex" }, { trigger: el }) },
          { label: "Run an experiment", icon: <FlaskConical className="size-7" aria-hidden />, run: (el: HTMLElement) => open("ai-lab", undefined, { trigger: el }) },
        ].map((s) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={(e) => s.run(e.currentTarget)}
              className="flex w-24 flex-col items-center gap-1.5 rounded-xl p-2 text-center text-[12px] font-medium text-fg [text-shadow:0_1px_2px_var(--bg)] hover:bg-hover focus-visible:bg-hover"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-[rgba(var(--glass-rgb),0.55)] text-fg shadow-lg ring-1 ring-[var(--glass-edge)] backdrop-blur-sm">{s.icon}</span>
              {s.label}
            </button>
          </li>
        ))}
      </ul>

      <aside aria-label="Widgets" className="absolute top-4 right-4 hidden w-[300px] flex-col gap-3 xl:flex">
        <section className="glass glass-edge rounded-[22px] p-4 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-3">
            <Image src={profile.photo.src} alt={profile.photo.alt} width={56} height={56} className="size-14 rounded-full object-cover ring-2 ring-white/40" priority />
            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-semibold text-fg">{profile.name}</h2>
              <p className="text-[12.5px] text-muted">{profile.roles.join(" · ")}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
            <MapPin className="size-3.5" aria-hidden /> {profile.location}
          </p>
          <p className="mt-1 text-[12.5px] text-fg">{profile.availability.label}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={(e) => open("resume", undefined, { trigger: e.currentTarget })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-accent-strong text-[13px] font-medium text-white">
              <Download className="size-3.5" aria-hidden /> Résumé
            </button>
            <button type="button" onClick={(e) => open("contact", undefined, { trigger: e.currentTarget })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-hairline bg-sunken text-[13px] font-medium text-fg">
              <Mail className="size-3.5" aria-hidden /> Contact
            </button>
          </div>
        </section>
        <section className="glass glass-edge rounded-[22px] p-4 shadow-[var(--shadow-float)]">
          <p className="text-[11px] font-semibold tracking-wider text-subtle uppercase">Now building</p>
          <h2 className="mt-1 font-display text-[16px] font-semibold text-fg">{flagship.title}</h2>
          <p className="mt-1 text-[12.5px] text-muted">{flagship.statusNote}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-sunken p-2">
              <dt className="text-[11px] text-subtle">Tests (local, 24 Oct)</dt>
              <dd className="font-display text-lg font-semibold text-fg tabular-nums">{flagshipTests}</dd>
            </div>
            <div className="rounded-xl bg-sunken p-2">
              <dt className="text-[11px] text-subtle">Commits</dt>
              <dd className="font-display text-lg font-semibold text-fg tabular-nums">247</dd>
            </div>
          </dl>
          <button type="button" onClick={(e) => open("projects", { slug: "journex" }, { trigger: e.currentTarget })} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-accent-text">
            Read the case study <ArrowUpRight className="size-3.5" aria-hidden />
          </button>
        </section>
      </aside>
    </div>
  );
}

export function MobileHome() {
  const { open, store } = useOS();
  const apps: AppId[] = APP_IDS.filter((id) => id !== "home");
  return (
    <div className="fixed inset-0 top-[var(--menubar-h)] flex flex-col md:hidden" data-desktop-focus tabIndex={-1} aria-label="Home screen" role="region">
      <div className="scroll-area flex-1 px-4 pt-4 pb-28">
        <section className="glass glass-edge rounded-[24px] p-4 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-3">
            <Image src={profile.photo.src} alt={profile.photo.alt} width={60} height={60} className="size-15 rounded-full object-cover ring-2 ring-white/40" priority />
            <div>
              <h2 className="font-display text-[19px] font-semibold text-fg">{profile.name}</h2>
              <p className="text-[13px] text-muted">{profile.roles.join(" · ")}</p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-fg">{profile.headline}</p>
          <p className="mt-1 text-[12.5px] text-muted">{profile.availability.label}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => open("resume")} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-accent-strong text-[13px] font-medium text-white">
              <Download className="size-4" aria-hidden /> Résumé
            </button>
            <button type="button" onClick={() => open("projects")} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-hairline bg-sunken text-[13px] font-medium text-fg">
              Projects
            </button>
            <button type="button" onClick={() => open("recruiter")} className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-hairline bg-sunken text-[13px] font-medium text-fg">
              <BriefcaseBusiness className="size-4" aria-hidden /> Hiring
            </button>
          </div>
        </section>

        <ul className="mt-6 grid grid-cols-4 gap-x-2 gap-y-5" aria-label="Apps">
          {apps.map((id) => (
            <li key={id} className="flex justify-center">
              <button type="button" onClick={() => open(id)} className="flex w-[72px] flex-col items-center gap-1.5 rounded-2xl p-1 active:scale-95">
                <AppIcon app={id} size={58} />
                <span className="w-full truncate text-center text-[11.5px] font-medium text-fg [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">{APPS[id].title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <nav aria-label="Quick dock" className="fixed inset-x-3 bottom-3 pb-[env(safe-area-inset-bottom)]">
        <div className="glass glass-edge flex items-center justify-around rounded-[26px] px-3 py-2.5 shadow-[var(--shadow-float)]">
          {MOBILE_DOCK_APPS.map((id) => (
            <button key={id} type="button" onClick={() => open(id)} aria-label={APPS[id].title} className="rounded-2xl active:scale-95">
              <AppIcon app={id} size={54} />
            </button>
          ))}
          <button type="button" onClick={() => store.dispatch({ type: "spotlight", open: true })} aria-label="Search" className="rounded-2xl active:scale-95">
            <AppIcon app="spotlight" size={54} />
          </button>
        </div>
      </nav>
    </div>
  );
}

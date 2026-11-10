"use client";

import { ArrowRight, BriefcaseBusiness, Download, Mail, Sparkles, X } from "lucide-react";
import { GitHubGlyph, LinkedInGlyph } from "@/design/icons/Brand";
import Image from "next/image";
import { profile } from "@/content/profile";
import { getProject, projects } from "@/content/projects";
import { skills } from "@/content/skills";
import { AppIcon } from "@/design/icons/AppIcon";
import { Badge, Button, Chip, LinkButton, Stat } from "@/design/ui";
import { APPS, type AppId } from "@/os/apps";
import { useOS } from "@/os/OSContext";
import { setPrefs } from "@/os/state/prefs";
import { AppScroll, ProjectCover, ProjectStatus } from "../shared";

const flagship = getProject("journex")!;
const second = getProject("intelligrade-ai")!;
const SIGNATURE: AppId[] = ["xray", "ai-lab", "research", "quality"];

export default function HomeApp() {
  const { open } = useOS();
  const shipped = skills.filter((s) => s.evidenceLevel === "shipped" || s.evidenceLevel === "project").slice(0, 14);
  const flagshipTests = flagship.testing.suites.reduce((s, x) => s + (x.count ?? 0), 0);

  return (
    <AppScroll wide>
      <QuickStart />
      <section aria-labelledby="home-hero" className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <Image src={profile.photo.src} alt={profile.photo.alt} width={132} height={132} className="size-24 rounded-[28px] object-cover shadow-lg ring-1 ring-white/30 md:size-[132px]" priority />
        <div>
          <p className="text-[13px] font-medium text-accent-text">{profile.roles.join(" · ")}</p>
          <h3 id="home-hero" tabIndex={-1} className="text-gradient mt-1 w-fit font-display text-[32px] leading-tight font-semibold outline-none md:text-[40px]">
            {profile.name}
          </h3>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-fg">{profile.headline}</p>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{profile.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="success">{profile.availability.label}</Badge>
            <Badge>{profile.location}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={profile.resume.href} download={profile.resume.fileName} variant="primary" external={false}>
              <Download className="size-4" aria-hidden /> Download résumé
            </LinkButton>
            <Button onClick={(e) => open("contact", undefined, { trigger: e.currentTarget })}>
              <Mail className="size-4" aria-hidden /> Contact
            </Button>
            <Button onClick={(e) => open("recruiter", undefined, { trigger: e.currentTarget })}>
              <BriefcaseBusiness className="size-4" aria-hidden /> Recruiter Mode
            </Button>
            <LinkButton href={profile.links.github} variant="ghost">
              <GitHubGlyph /> GitHub
            </LinkButton>
            <LinkButton href={profile.links.linkedin} variant="ghost">
              <LinkedInGlyph /> LinkedIn
            </LinkButton>
          </div>
        </div>
      </section>

      <dl className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="CGPA" value="9.12 / 10" hint="B.Tech CSE (Data Science), 2027" />
        <Stat label="Case studies" value={projects.length} hint="Each with sources and limits" />
        <Stat label="Flagship tests" value={flagshipTests} hint="JOURNEX, last local run 24 Oct" />
        <Stat label="Registered design" value="No. 483324-001" hint="Co-holder, Designs Act 2000" />
      </dl>

      <section aria-labelledby="home-flagship" className="mt-8">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-subtle uppercase">Flagship project</p>
        <article className="card grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
          <ProjectCover project={flagship} className="aspect-[16/8] md:aspect-auto md:min-h-[260px]" priority />
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatus project={flagship} />
              <Badge>Team of 4</Badge>
            </div>
            <h4 id="home-flagship" className="mt-2 font-display text-xl font-semibold text-fg">
              {flagship.title}
            </h4>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{flagship.tagline}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-fg">
              The research question had an honest answer: ranking by predicted durability gained <strong>+0.34</strong> completed rides per 100 searches; asking shaky bookings to release early added nothing measurable — and the project says so.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={(e) => open("projects", { slug: flagship.slug }, { trigger: e.currentTarget })}>
                Read case study <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button onClick={(e) => open("xray", { system: "journex" }, { trigger: e.currentTarget })}>Open architecture X-Ray</Button>
            </div>
          </div>
        </article>
        <button
          type="button"
          onClick={(e) => open("projects", { slug: second.slug }, { trigger: e.currentTarget })}
          className="card mt-3 flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-hover"
        >
          <AppIcon app="ai-lab" size={40} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-fg">{second.title}</span>
              <ProjectStatus project={second} />
            </span>
            <span className="block truncate text-[13px] text-muted">{second.tagline}</span>
          </span>
          <ArrowRight className="size-4 text-muted" aria-hidden />
        </button>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="home-skills" className="card p-5">
          <h4 id="home-skills" className="font-display text-[17px] font-semibold text-fg">
            Skills, with evidence
          </h4>
          <p className="mt-1 text-[13px] text-muted">No self-rated percentages — every skill links to the projects that use it.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shipped.map((s) => (
              <Chip key={s.id} onClick={() => open("skills", { skill: s.id })}>
                {s.name}
              </Chip>
            ))}
          </div>
        </section>
        <section aria-labelledby="home-about" className="card p-5">
          <h4 id="home-about" className="font-display text-[17px] font-semibold text-fg">
            About
          </h4>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{profile.about.intro}</p>
          <Button className="mt-3" size="sm" onClick={(e) => open("about", undefined, { trigger: e.currentTarget })}>
            Read more <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </section>
      </div>

      <section aria-labelledby="home-signature" className="mt-8">
        <h4 id="home-signature" className="mb-3 font-display text-[17px] font-semibold text-fg">
          Explore the evidence
        </h4>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNATURE.map((id) => (
            <li key={id}>
              <button type="button" onClick={(e) => open(id, undefined, { trigger: e.currentTarget })} className="card flex h-full w-full flex-col items-start gap-2 p-4 text-left transition-colors hover:bg-hover">
                <AppIcon app={id} size={40} />
                <span className="font-semibold text-fg">{APPS[id].title}</span>
                <span className="text-[13px] text-muted">{APPS[id].description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AppScroll>
  );
}

const QUICK_START: Array<{ app: AppId | "spotlight"; title: string; hint: string }> = [
  { app: "projects", title: "Browse projects", hint: "14 case studies, each with sources" },
  { app: "ask", title: "Ask a question", hint: "Answers cite this portfolio" },
  { app: "recruiter", title: "Recruiter summary", hint: "Pick the role you're hiring for" },
  { app: "spotlight", title: "Search everything", hint: "Ctrl K (⌘ K on a Mac)" },
];

/** First-visit shortcuts. Hidden from Settings → Help, or with the close button; applied before paint, so no layout jump. */
function QuickStart() {
  const { open, store } = useOS();
  return (
    <section aria-labelledby="quick-start-title" className="quick-start card mb-7 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 id="quick-start-title" className="flex items-center gap-2 font-display text-[16px] font-semibold text-fg">
            <Sparkles className="size-4 text-accent-text" aria-hidden /> Quick start
          </h4>
          <p className="mt-0.5 text-[13.5px] text-muted">Open apps from the dock and drag windows anywhere, or jump straight in:</p>
        </div>
        <button
          type="button"
          aria-label="Hide quick start"
          title="Hide (bring it back in Settings → Help)"
          onClick={() => {
            setPrefs({ showTips: false });
            document.getElementById("home-hero")?.focus();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_START.map((item) => (
          <li key={item.app}>
            <button
              type="button"
              onClick={(e) => (item.app === "spotlight" ? store.dispatch({ type: "spotlight", open: true }) : open(item.app, undefined, { trigger: e.currentTarget }))}
              className="card flex h-full w-full items-center gap-3 p-3 text-left"
            >
              <AppIcon app={item.app} size={36} />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-fg">{item.title}</span>
                <span className="block text-[12px] text-muted">{item.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

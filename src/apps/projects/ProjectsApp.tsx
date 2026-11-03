"use client";

import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { allTechnologies, categoryLabels, getProject, projects, statusLabels } from "@/content/projects";
import type { ProjectCategory, ProjectStatus as Status } from "@/content/schema";
import { Button, Chip } from "@/design/ui";
import { cn } from "@/lib/cn";
import { DEFAULT_PROJECT_QUERY, filterProjects, type ProjectQuery, type ProjectSort } from "@/lib/projectFilter";
import { useOS } from "@/os/OSContext";
import type { AppProps } from "@/os/WindowLayer";
import { AppScroll, ProjectCover, ProjectStatus, formatMonth } from "../shared";
import { CaseStudy } from "./CaseStudy";

export default function ProjectsApp({ params }: AppProps) {
  const slug = params.slug;
  const project = slug ? getProject(slug) : undefined;
  if (project) return <CaseStudy key={project.slug} project={project} />;
  return <ProjectList missing={slug} />;
}

function ProjectList({ missing }: { missing?: string }) {
  const { setParams } = useOS();
  const [q, setQ] = useState<ProjectQuery>(DEFAULT_PROJECT_QUERY);
  const [showFilters, setShowFilters] = useState(false);
  const deferredText = useDeferredValue(q.text);
  const results = useMemo(() => filterProjects(projects, { ...q, text: deferredText }), [q, deferredText]);
  const searchRef = useRef<HTMLInputElement>(null);
  const categories = Object.keys(categoryLabels) as ProjectCategory[];
  const statuses = Object.keys(statusLabels) as Status[];
  const active = q.category !== "all" || q.status !== "all" || q.tech !== "all" || q.text !== "";

  return (
    <AppScroll wide>
      {missing && (
        <p role="alert" className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2 text-[13px] text-warning">
          No project called “{missing}”. Showing all projects instead.
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold text-fg">Projects</h3>
          <p className="mt-1 text-[14px] text-muted">
            {projects.length} case studies. Every status, number and claim links to where it was verified.
          </p>
        </div>
      </div>

      <div role="search" aria-label="Filter projects" className="sticky top-0 z-10 -mx-1 mb-4 rounded-2xl bg-[var(--surface-solid)]/90 px-1 pt-1 pb-2 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={q.text}
              onChange={(e) => setQ({ ...q, text: e.target.value })}
              placeholder="Search by name, technology or idea…"
              className="h-10 w-full rounded-[var(--radius-control)] border border-hairline bg-sunken pr-3 pl-9 text-[14px] text-fg outline-none placeholder:text-subtle focus:border-accent/60"
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <span>Sort</span>
            <select
              value={q.sort}
              onChange={(e) => setQ({ ...q, sort: e.target.value as ProjectSort })}
              className="h-10 rounded-[var(--radius-control)] border border-hairline bg-sunken px-3 text-[14px] text-fg"
            >
              <option value="featured">Featured</option>
              <option value="newest">Most recent</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
          <Button className="md:hidden" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} aria-controls="project-filters">
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
          </Button>
        </div>

        {/* Always visible on desktop; collapsible on phones. */}
        <div id="project-filters" className={cn("mt-3 space-y-2.5", !showFilters && "max-md:hidden")}>
            <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
              <Chip active={q.category === "all"} onClick={() => setQ({ ...q, category: "all" })}>
                All categories
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={q.category === c} onClick={() => setQ({ ...q, category: c })}>
                  {categoryLabels[c]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5">
                <Chip active={q.status === "all"} onClick={() => setQ({ ...q, status: "all" })}>
                  Any status
                </Chip>
                {statuses.map((s) => (
                  <Chip key={s} active={q.status === s} onClick={() => setQ({ ...q, status: s })}>
                    {statusLabels[s]}
                  </Chip>
                ))}
              </div>
              <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
                Technology
                <select
                  value={q.tech}
                  onChange={(e) => setQ({ ...q, tech: e.target.value })}
                  className="h-9 max-w-[200px] rounded-[var(--radius-control)] border border-hairline bg-sunken px-2 text-[13px] text-fg"
                >
                  <option value="all">Any technology</option>
                  {allTechnologies.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
        </div>
      </div>

      <p className="mb-3 text-[13px] text-muted" role="status" aria-live="polite">
        {results.length === projects.length ? `Showing all ${results.length} projects` : `${results.length} of ${projects.length} projects match`}
        {active && (
          <>
            {" · "}
            <button type="button" className="text-accent-text underline underline-offset-2" onClick={() => setQ({ ...DEFAULT_PROJECT_QUERY, sort: q.sort })}>
              Clear filters
            </button>
          </>
        )}
      </p>

      {results.length === 0 ? (
        <div className="card p-8 text-center text-muted">Nothing matches. Try a broader term such as “React”, “Python” or “dashboard”.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p, i) => (
            <li key={p.slug}>
              <article className="card group relative flex h-full flex-col overflow-hidden transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-hover">
                <ProjectCover project={p} className="aspect-[16/9]" priority={i < 3} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <ProjectStatus project={p} />
                    <span className="text-[12px] text-subtle">{categoryLabels[p.category]}</span>
                    <span className="text-[12px] text-subtle">·</span>
                    <span className="text-[12px] text-subtle">
                      {formatMonth(p.period.start)} – {formatMonth(p.period.end)}
                    </span>
                  </div>
                  <h4 className="font-display text-[17px] font-semibold text-fg">
                    <button
                      type="button"
                      onClick={() => setParams("projects", { slug: p.slug })}
                      className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {p.title}
                    </button>
                  </h4>
                  <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{p.tagline}</p>
                  <ul className="mt-auto flex flex-wrap gap-1 pt-3" aria-label="Technologies">
                    {p.technologies.slice(0, 5).map((t) => (
                      <li key={t}>
                        <Chip>{t}</Chip>
                      </li>
                    ))}
                    {p.technologies.length > 5 && (
                      <li>
                        <Chip>+{p.technologies.length - 5}</Chip>
                      </li>
                    )}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </AppScroll>
  );
}

export function BackToProjects() {
  const { setParams } = useOS();
  return (
    <Button size="sm" variant="ghost" onClick={() => setParams("projects", {})} className="-ml-2">
      <ArrowLeft className="size-4" aria-hidden /> All projects
    </Button>
  );
}

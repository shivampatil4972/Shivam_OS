"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { certifications } from "@/content/education";
import { getProject, projects } from "@/content/projects";
import type { Skill } from "@/content/schema";
import { evidenceLevelLabels, skillGroupLabels, skills } from "@/content/skills";
import { Badge, Chip, ExternalLink, TabPanel, Tabs } from "@/design/ui";
import { cn } from "@/lib/cn";
import { useOS } from "@/os/OSContext";
import type { AppProps } from "@/os/WindowLayer";
import { AppScroll } from "../shared";

const LEVEL_TONE = { shipped: "success", project: "accent", certified: "info", coursework: "neutral", listed: "neutral" } as const;
const groups = Object.keys(skillGroupLabels) as Skill["group"][];

export default function SkillsApp({ params }: AppProps) {
  const [tab, setTab] = useState<"list" | "graph">("list");
  return (
    <AppScroll wide>
      <div className="mb-4">
        <h3 className="font-display text-2xl font-semibold text-fg">Skills</h3>
        <p className="mt-1 max-w-3xl text-[14px] text-muted">
          Each skill is backed by evidence — a project that uses it, or a certificate — instead of a self-rated percentage.
        </p>
      </div>
      <Tabs
        label="Skills views"
        idBase="skills"
        value={tab}
        onChange={setTab}
        items={[
          { id: "list", label: "By category" },
          { id: "graph", label: "Proof-of-Work graph" },
        ]}
      />
      <div className="mt-4">
        {tab === "list" ? (
          <TabPanel idBase="skills" id="list">
            <SkillList focus={params.skill} />
          </TabPanel>
        ) : (
          <TabPanel idBase="skills" id="graph">
            <ProofGraph />
          </TabPanel>
        )}
      </div>
    </AppScroll>
  );
}

function SkillList({ focus }: { focus?: string }) {
  const { open } = useOS();
  const refs = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    if (focus) refs.current.get(focus)?.scrollIntoView({ block: "center" });
  }, [focus]);
  return (
    <div className="space-y-6">
      <ul className="flex flex-wrap gap-3 text-[12.5px] text-muted" aria-label="Evidence levels">
        {(Object.keys(evidenceLevelLabels) as Skill["evidenceLevel"][]).map((l) => (
          <li key={l} className="flex items-center gap-1.5">
            <Badge tone={LEVEL_TONE[l]}>{evidenceLevelLabels[l].label}</Badge>
            {evidenceLevelLabels[l].description}
          </li>
        ))}
      </ul>
      {groups.map((g) => {
        const list = skills.filter((s) => s.group === g);
        if (list.length === 0) return null;
        return (
          <section key={g} aria-labelledby={`sg-${g}`}>
            <h4 id={`sg-${g}`} className="mb-2 font-display text-[16px] font-semibold text-fg">
              {skillGroupLabels[g]}
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <li
                  key={s.id}
                  ref={(el) => {
                    if (el) refs.current.set(s.id, el);
                  }}
                  className={cn("card p-3", focus === s.id && "ring-2 ring-accent")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-fg">{s.name}</p>
                    <Badge tone={LEVEL_TONE[s.evidenceLevel]}>{evidenceLevelLabels[s.evidenceLevel].label}</Badge>
                  </div>
                  {s.note && <p className="mt-1 text-[12.5px] text-muted">{s.note}</p>}
                  {s.projects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.projects.map((slug) => (
                        <Chip key={slug} onClick={() => open("projects", { slug })} className="min-h-7 text-[12px]">
                          {getProject(slug)?.title ?? slug}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {s.certifications.length > 0 && (
                    <p className="mt-2 text-[12px] text-subtle">
                      Certificates: {s.certifications.map((c) => certifications.find((x) => x.id === c)?.title ?? c).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proof-of-Work graph
// ---------------------------------------------------------------------------
function ProofGraph() {
  const [group, setGroup] = useState<Skill["group"] | "all">("ai-ml");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "matrix">("graph");
  const container = useRef<HTMLDivElement>(null);
  const skillRefs = useRef(new Map<string, HTMLElement>());
  const projectRefs = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<Array<{ key: string; d: string; skill: string; project: string }>>([]);

  const visibleSkills = useMemo(() => skills.filter((s) => (group === "all" || s.group === group) && s.projects.length > 0), [group]);
  const visibleProjects = useMemo(() => {
    const used = new Set(visibleSkills.flatMap((s) => s.projects));
    return projects.filter((p) => used.has(p.slug));
  }, [visibleSkills]);

  useLayoutEffect(() => {
    const compute = () => {
      const box = container.current?.getBoundingClientRect();
      if (!box) return;
      const out: typeof lines = [];
      for (const s of visibleSkills) {
        const a = skillRefs.current.get(s.id)?.getBoundingClientRect();
        if (!a) continue;
        for (const slug of s.projects) {
          const b = projectRefs.current.get(slug)?.getBoundingClientRect();
          if (!b) continue;
          const x1 = a.right - box.left;
          const y1 = a.top + a.height / 2 - box.top;
          const x2 = b.left - box.left;
          const y2 = b.top + b.height / 2 - box.top;
          const mid = (x1 + x2) / 2;
          out.push({ key: `${s.id}-${slug}`, d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`, skill: s.id, project: slug });
        }
      }
      setLines(out);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (container.current) ro.observe(container.current);
    return () => ro.disconnect();
  }, [visibleSkills, visibleProjects, view]);

  const active = (skill: string, project: string) =>
    (selectedSkill ? selectedSkill === skill : true) && (selectedProject ? selectedProject === project : true) && (selectedSkill !== null || selectedProject !== null);
  const project = selectedProject ? getProject(selectedProject) : undefined;
  const skill = selectedSkill ? skills.find((s) => s.id === selectedSkill) : undefined;

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] text-muted">
        Every line connects a skill to a project that uses it. Select a skill or a project to see the evidence behind the connection — source code, tests, reports and documentation.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Skill group
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value as Skill["group"] | "all");
              setSelectedSkill(null);
              setSelectedProject(null);
            }}
            className="h-9 rounded-[var(--radius-control)] border border-hairline bg-sunken px-2 text-[13px] text-fg"
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {skillGroupLabels[g]}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Graph view" className="ml-auto flex gap-1 rounded-[12px] bg-sunken p-1">
          {(["graph", "matrix"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("h-8 rounded-[9px] px-3 text-[13px] font-medium", view === v ? "bg-raised text-fg shadow-sm" : "text-muted")}>
              {v === "graph" ? "Graph" : "Evidence matrix"}
            </button>
          ))}
        </div>
      </div>

      {view === "graph" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div ref={container} className="relative grid grid-cols-[minmax(0,1fr)_minmax(40px,0.6fr)_minmax(0,1.2fr)] items-start">
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              {lines.map((l) => {
                const on = active(l.skill, l.project);
                const dim = (selectedSkill || selectedProject) && !on;
                return <path key={l.key} d={l.d} fill="none" stroke={on ? "var(--accent)" : "var(--hairline-strong)"} strokeWidth={on ? 2.2 : 1.2} opacity={dim ? 0.25 : 1} />;
              })}
            </svg>
            <ul className="relative z-10 space-y-1.5" aria-label="Skills">
              {visibleSkills.map((s) => (
                <li key={s.id}>
                  <button
                    ref={(el) => {
                      if (el) skillRefs.current.set(s.id, el);
                      else skillRefs.current.delete(s.id);
                    }}
                    type="button"
                    aria-pressed={selectedSkill === s.id}
                    onClick={() => {
                      setSelectedSkill(selectedSkill === s.id ? null : s.id);
                      setSelectedProject(null);
                    }}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
                      selectedSkill === s.id ? "border-accent bg-accent-soft text-accent-text" : "border-hairline bg-[var(--surface-raised)] text-fg hover:bg-hover",
                    )}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
            <span aria-hidden />
            <ul className="relative z-10 space-y-1.5" aria-label="Projects">
              {visibleProjects.map((p) => (
                <li key={p.slug}>
                  <button
                    ref={(el) => {
                      if (el) projectRefs.current.set(p.slug, el);
                      else projectRefs.current.delete(p.slug);
                    }}
                    type="button"
                    aria-pressed={selectedProject === p.slug}
                    onClick={() => setSelectedProject(selectedProject === p.slug ? null : p.slug)}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
                      selectedProject === p.slug ? "border-accent bg-accent-soft text-accent-text" : "border-hairline bg-[var(--surface-raised)] text-fg hover:bg-hover",
                    )}
                  >
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <aside aria-live="polite" aria-label="Evidence" className="card h-fit p-4 text-[13.5px]">
            {!skill && !project && <p className="text-muted">Select a skill or a project to inspect the evidence.</p>}
            {skill && (
              <div className="mb-3">
                <p className="font-semibold text-fg">{skill.name}</p>
                <p className="text-muted">
                  {evidenceLevelLabels[skill.evidenceLevel].description}. Used in {skill.projects.length} project{skill.projects.length === 1 ? "" : "s"}.
                </p>
              </div>
            )}
            {(project ? [project] : skill ? skill.projects.map((s) => getProject(s)).filter((p) => p !== undefined) : []).map((p) => (
              <div key={p.slug} className="mt-3 border-t border-hairline pt-3 first:mt-0 first:border-0 first:pt-0">
                <p className="font-semibold text-fg">{p.title}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {p.evidence.slice(0, 5).map((ev) => (
                    <li key={ev.id} className="flex items-start gap-2">
                      <Badge>{ev.kind}</Badge>
                      <span className="min-w-0 text-muted">{ev.href ? <ExternalLink href={ev.href}>{ev.label}</ExternalLink> : ev.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      ) : (
        <EvidenceMatrix list={visibleSkills} />
      )}
    </div>
  );
}

function EvidenceMatrix({ list }: { list: Skill[] }) {
  const used = projects.filter((p) => list.some((s) => s.projects.includes(p.slug)));
  return (
    <div className="scroll-area max-w-full rounded-xl border border-hairline" tabIndex={0} role="region" aria-label="Evidence matrix">
      <table className="w-full min-w-[640px] text-[12.5px]">
        <caption className="sr-only">Which projects provide evidence for each skill</caption>
        <thead>
          <tr className="bg-sunken text-subtle">
            <th scope="col" className="sticky left-0 bg-[var(--surface-solid)] px-3 py-2 text-left font-medium">
              Skill
            </th>
            {used.map((p) => (
              <th key={p.slug} scope="col" className="px-2 py-2 text-left font-medium">
                {p.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {list.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="sticky left-0 bg-[var(--surface-solid)] px-3 py-1.5 text-left font-medium text-fg">
                {s.name}
              </th>
              {used.map((p) => (
                <td key={p.slug} className="px-2 py-1.5 text-center">
                  {s.projects.includes(p.slug) ? (
                    <>
                      <span className="text-success" aria-hidden>
                        ●
                      </span>
                      <span className="sr-only">Yes</span>
                    </>
                  ) : (
                    <span className="sr-only">No</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

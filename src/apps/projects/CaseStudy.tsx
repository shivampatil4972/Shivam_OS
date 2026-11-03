"use client";

import { Check, GitCommit, Link2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { categoryLabels } from "@/content/projects";
import type { Project } from "@/content/schema";
import { xraySystems } from "@/content/xray";
import { Badge, Chip, ExternalLink, LinkButton, TabPanel, Tabs, Txt } from "@/design/ui";
import { cn } from "@/lib/cn";
import { useOS } from "@/os/OSContext";
import { copyText } from "@/os/state/activity";
import { XRayDiagram } from "../xray/XRayDiagram";
import { BulletList, ProjectStatus, Section, formatDate, formatMonth } from "../shared";
import { BackToProjects } from "./ProjectsApp";

type TabId = "overview" | "architecture" | "evolution" | "evidence";

const EVIDENCE_TONE = {
  source: "accent",
  test: "success",
  doc: "info",
  report: "info",
  demo: "accent",
  commit: "neutral",
  certificate: "neutral",
  dataset: "warning",
  screenshot: "neutral",
} as const;

const SUITE_STATUS = {
  "reported-passing": { label: "Reported passing", tone: "success" },
  "defined-not-run-here": { label: "Defined · not run here", tone: "warning" },
  "not-available": { label: "Not available", tone: "neutral" },
} as const;

export function CaseStudy({ project: p }: { project: Project }) {
  const [tab, setTab] = useState<TabId>("overview");
  const { open } = useOS();
  const xray = p.architecture.xrayId ? xraySystems.find((s) => s.id === p.architecture.xrayId) : undefined;
  const idBase = `cs-${p.slug}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/projects/${p.slug}` : `/projects/${p.slug}`;

  return (
    <div className="scroll-area h-full">
      <article className="mx-auto max-w-4xl px-5 py-4 md:px-7" aria-labelledby={`${idBase}-title`}>
        <BackToProjects />
        <header className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatus project={p} />
            <Badge>{categoryLabels[p.category]}</Badge>
            <span className="text-[12.5px] text-subtle">
              {formatMonth(p.period.start)} – {formatMonth(p.period.end)}
            </span>
          </div>
          <h3 id={`${idBase}-title`} className="mt-2 font-display text-[28px] leading-tight font-semibold text-fg">
            {p.title}
          </h3>
          <p className="mt-1.5 text-[16px] leading-relaxed text-fg">{p.tagline}</p>
          <p className="mt-1 text-[13px] text-muted">
            <Txt>{p.statusNote}</Txt>
          </p>
          <dl className="mt-4 grid gap-3 text-[13.5px] sm:grid-cols-3">
            <div className="card p-3">
              <dt className="text-[12px] text-subtle">Role</dt>
              <dd className="font-medium text-fg">{p.role}</dd>
            </div>
            <div className="card p-3">
              <dt className="text-[12px] text-subtle">Team</dt>
              <dd className="font-medium text-fg">
                {p.team.size ? `${p.team.size} people` : "Size not confirmed"}
                <span className="block text-[12.5px] font-normal text-muted">
                  <Txt>{p.team.note}</Txt>
                </span>
              </dd>
            </div>
            <div className="card p-3">
              <dt className="text-[12px] text-subtle">Last verified</dt>
              <dd className="font-medium text-fg">{formatDate(p.updated)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.links.map((l) => (
              <LinkButton key={l.href} href={l.href} variant={l.kind === "repo" || l.kind === "demo" ? "primary" : "secondary"} className="h-9">
                {l.label}
              </LinkButton>
            ))}
            <ShareButton url={shareUrl} />
          </div>
          {p.links.length === 0 && <p className="mt-2 text-[12.5px] text-muted">No public repository or demo for this project yet — see the evidence tab for what was verified.</p>}
        </header>

        {p.media.cover && (
          <figure className="mt-5 overflow-hidden rounded-2xl border border-hairline">
            <Image src={p.media.cover.src} alt={p.media.cover.alt} width={p.media.cover.width} height={p.media.cover.height} className="h-auto w-full" sizes="(max-width: 900px) 100vw, 860px" priority />
            {p.media.cover.caption && <figcaption className="border-t border-hairline px-3 py-2 text-[12.5px] text-muted">{p.media.cover.caption}</figcaption>}
          </figure>
        )}

        <Tabs
          className="mt-6"
          label="Case study sections"
          idBase={idBase}
          value={tab}
          onChange={setTab}
          items={[
            { id: "overview", label: "Case study" },
            { id: "architecture", label: "Architecture" },
            { id: "evolution", label: `Evolution (${p.evolution.length})` },
            { id: "evidence", label: `Evidence (${p.evidence.length})` },
          ]}
        />

        <div className="mt-5 pb-10">
          {tab === "overview" && (
            <TabPanel idBase={idBase} id="overview">
              <Section title="Problem and motivation" id={`${idBase}-problem`}>
                <p className="text-[14.5px] leading-relaxed text-fg">{p.problem}</p>
              </Section>
              <Section title="Who it is for" id={`${idBase}-users`}>
                <BulletList items={p.targetUsers} />
              </Section>
              <Section title="Solution and key workflows" id={`${idBase}-solution`}>
                <p className="mb-3 text-[14.5px] leading-relaxed text-fg">{p.solution}</p>
                <BulletList items={p.workflows} />
              </Section>
              <Section title="Personal contribution" id={`${idBase}-contribution`}>
                <p className="mb-2 text-[14.5px] leading-relaxed text-fg">
                  <Txt>{p.contribution.summary}</Txt>
                </p>
                <BulletList items={p.contribution.items} />
                {p.aiAssistance && (
                  <p className="mt-3 rounded-xl border border-info/30 bg-info/8 px-3 py-2 text-[13px] text-fg">
                    <span className="font-semibold">AI assistance disclosure. </span>
                    {p.aiAssistance}
                  </p>
                )}
              </Section>
              <Section title="Technology choices" id={`${idBase}-tech`}>
                <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Technologies">
                  {p.technologies.map((t) => (
                    <li key={t}>
                      <Chip>{t}</Chip>
                    </li>
                  ))}
                </ul>
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Technology rationale table">
                  <table className="w-full text-left text-[13.5px]">
                    <caption className="sr-only">Why each technology was chosen</caption>
                    <thead className="text-[12px] text-subtle">
                      <tr>
                        <th scope="col" className="py-1.5 pr-4 font-medium">
                          Choice
                        </th>
                        <th scope="col" className="py-1.5 font-medium">
                          Rationale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {p.techRationale.map((t) => (
                        <tr key={t.tech}>
                          <th scope="row" className="py-2 pr-4 align-top font-medium whitespace-nowrap text-fg">
                            {t.tech}
                          </th>
                          <td className="py-2 text-muted">{t.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="Implementation details" id={`${idBase}-impl`}>
                <BulletList items={p.implementation} />
              </Section>
              <Section title="Engineering challenges" id={`${idBase}-challenges`}>
                <ul className="space-y-3">
                  {p.challenges.map((c) => (
                    <li key={c.title} className="card p-3.5">
                      <p className="font-semibold text-fg">{c.title}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-muted">
                        <Txt>{c.detail}</Txt>
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Alternatives and trade-offs" id={`${idBase}-tradeoffs`}>
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Trade-offs table">
                  <table className="w-full min-w-[560px] text-left text-[13.5px]">
                    <caption className="sr-only">Decisions, the alternatives considered and their cost</caption>
                    <thead className="text-[12px] text-subtle">
                      <tr>
                        <th scope="col" className="py-1.5 pr-3 font-medium">Decision</th>
                        <th scope="col" className="py-1.5 pr-3 font-medium">Alternatives</th>
                        <th scope="col" className="py-1.5 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline align-top">
                      {p.tradeoffs.map((t) => (
                        <tr key={t.decision}>
                          <th scope="row" className="py-2 pr-3 font-medium text-fg">{t.decision}</th>
                          <td className="py-2 pr-3 text-muted">{t.alternatives}</td>
                          <td className="py-2 text-muted">{t.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="Testing" id={`${idBase}-testing`}>
                <p className="mb-3 text-[14px] leading-relaxed text-fg">
                  <Txt>{p.testing.summary}</Txt>
                </p>
                {p.testing.suites.length > 0 && (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {p.testing.suites.map((s) => (
                      <li key={s.name} className="card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-fg">{s.name}</p>
                          <Badge tone={SUITE_STATUS[s.status].tone}>{SUITE_STATUS[s.status].label}</Badge>
                        </div>
                        <p className="mt-1 text-[13px] text-muted">
                          <Txt>{s.detail}</Txt>
                        </p>
                        <p className="mt-1.5 text-[12px] text-subtle">
                          {s.count !== null ? `${s.count} tests` : "Count not recorded"}
                          {s.asOf ? ` · as of ${formatDate(s.asOf)}` : ""} · Source: {s.source}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="Results and measurements" id={`${idBase}-results`}>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {p.results.map((r) => (
                    <li key={r.label} className="card p-3.5">
                      <p className="text-[12px] text-subtle">{r.label}</p>
                      <p className="font-display text-xl font-semibold text-fg">{r.value}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        <Txt>{r.context}</Txt>
                      </p>
                      <p className="mt-1.5 text-[11.5px] text-subtle">Source: {r.source}</p>
                    </li>
                  ))}
                </ul>
                {p.slug === "placement-prediction-portal" && (
                  <button type="button" onClick={(e) => open("ai-lab", undefined, { trigger: e.currentTarget })} className="mt-3 text-[13.5px] font-medium text-accent-text underline underline-offset-2">
                    Re-run the evaluation in the AI Lab
                  </button>
                )}
              </Section>
              <Section title="Limitations and known issues" id={`${idBase}-limits`}>
                <BulletList items={p.limitations} />
              </Section>
              <Section title="Lessons learned" id={`${idBase}-lessons`}>
                <BulletList items={p.lessons} />
              </Section>
              <Section title="Future improvements" id={`${idBase}-future`}>
                <BulletList items={p.future} />
              </Section>
              <Section title="Setup and reproducibility" id={`${idBase}-setup`}>
                <pre tabIndex={0} className="scroll-area rounded-xl border border-hairline bg-[#05080f] p-4 font-mono text-[12.5px] leading-relaxed text-[#d6e2f5]">
                  {p.setup.steps.map((s) => (s.includes(" ") && !s.startsWith("Open") && !s.startsWith("Private") ? `$ ${s}` : s)).join("\n")}
                </pre>
                {p.setup.note && (
                  <p className="mt-2 text-[13px] text-muted">
                    <Txt>{p.setup.note}</Txt>
                  </p>
                )}
              </Section>
              {p.media.gallery.length > 0 && (
                <Section title="Figures" id={`${idBase}-figures`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {p.media.gallery.map((m) => (
                      <figure key={m.src} className="overflow-hidden rounded-xl border border-hairline bg-white">
                        <Image src={m.src} alt={m.alt} width={m.width} height={m.height} className="h-auto w-full" sizes="(max-width: 700px) 100vw, 420px" />
                        {m.caption && <figcaption className="border-t border-hairline bg-[var(--surface-solid)] px-3 py-2 text-[12.5px] text-muted">{m.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </Section>
              )}
            </TabPanel>
          )}

          {tab === "architecture" && (
            <TabPanel idBase={idBase} id="architecture">
              <p className="text-[14.5px] leading-relaxed text-fg">{p.architecture.summary}</p>
              <Section title="Data flow" id={`${idBase}-flow`}>
                <ol className="space-y-2">
                  {p.architecture.dataFlow.map((step, i) => (
                    <li key={step} className="flex gap-3 text-[14px] text-fg">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-text">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </Section>
              {xray ? (
                <Section title="Engineering X-Ray" id={`${idBase}-xray`}>
                  <XRayDiagram system={xray} compact />
                </Section>
              ) : (
                <p className="mt-5 text-[13px] text-muted">No interactive X-Ray diagram for this project yet.</p>
              )}
            </TabPanel>
          )}

          {tab === "evolution" && (
            <TabPanel idBase={idBase} id="evolution">
              <p className="mb-4 text-[13.5px] text-muted">Milestones taken from commit history and project documents. Commit references link to the public repository where one exists.</p>
              <ol className="relative space-y-4 border-l border-hairline-strong pl-6">
                {[...p.evolution].reverse().map((e) => (
                  <li key={`${e.date}-${e.title}`} className="relative">
                    <span className={cn("absolute top-1.5 -left-[31px] size-3 rounded-full ring-4 ring-[var(--surface-solid)]", e.kind === "fix" ? "bg-danger" : e.kind === "experiment" ? "bg-[#a78bfa]" : e.kind === "lesson" ? "bg-warning" : "bg-accent")} aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={e.date} className="text-[12.5px] text-subtle">
                        {formatDate(e.date)}
                      </time>
                      <Badge>{e.kind}</Badge>
                      {e.ref &&
                        (e.href ? (
                          <a href={e.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[12px] text-accent-text">
                            <GitCommit className="size-3.5" aria-hidden />
                            {e.ref}
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        ) : (
                          <span className="font-mono text-[12px] text-subtle">{e.ref}</span>
                        ))}
                    </div>
                    <p className="mt-0.5 font-semibold text-fg">{e.title}</p>
                    <p className="text-[13.5px] leading-relaxed text-muted">{e.detail}</p>
                  </li>
                ))}
              </ol>
            </TabPanel>
          )}

          {tab === "evidence" && (
            <TabPanel idBase={idBase} id="evidence">
              <p className="mb-4 text-[13.5px] text-muted">Where each claim on this page can be checked. Items without a link were verified from a private or local repository.</p>
              <ul className="space-y-2">
                {p.evidence.map((ev) => (
                  <li key={ev.id} className="card flex flex-wrap items-start gap-3 p-3.5">
                    <Badge tone={EVIDENCE_TONE[ev.kind]}>{ev.kind}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-fg">{ev.href ? <ExternalLink href={ev.href}>{ev.label}</ExternalLink> : ev.label}</p>
                      <p className="text-[13px] text-muted">{ev.note}</p>
                      <p className="mt-0.5 text-[12px] text-subtle">Verified from: {ev.verifiedFrom}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabPanel>
          )}
        </div>
      </article>
    </div>
  );
}

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(url, "Project link")) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
      className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-hairline bg-sunken px-3 text-sm font-medium text-fg hover:bg-hover"
    >
      {copied ? <Check className="size-4 text-success" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}


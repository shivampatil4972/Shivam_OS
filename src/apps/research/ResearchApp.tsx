"use client";

import Image from "next/image";
import { getProject } from "@/content/projects";
import { researchItems } from "@/content/research";
import type { Research } from "@/content/schema";
import { Badge, Button, LinkButton, Txt } from "@/design/ui";
import { cn } from "@/lib/cn";
import { useOS } from "@/os/OSContext";
import type { AppProps } from "@/os/WindowLayer";
import { BulletList, Section, formatDate } from "../shared";

const STATUS: Record<Research["status"], { label: string; tone: "neutral" | "info" | "warning" | "success" | "accent" }> = {
  draft: { label: "Draft", tone: "warning" },
  "internal-report": { label: "Internal report", tone: "info" },
  submitted: { label: "Submitted", tone: "accent" },
  accepted: { label: "Accepted", tone: "success" },
  published: { label: "Published", tone: "success" },
  "unpublished-project-research": { label: "Unpublished project research", tone: "warning" },
};

export default function ResearchApp({ params }: AppProps) {
  const { setParams } = useOS();
  const current = researchItems.find((r) => r.id === params.item) ?? researchItems[0]!;
  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[260px_1fr] md:grid-rows-1">
      <nav aria-label="Studies" className="scroll-area border-b border-hairline p-3 md:border-r md:border-b-0">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-subtle uppercase">Studies</p>
        <ul className="flex gap-1.5 overflow-x-auto md:flex-col">
          {researchItems.map((r) => (
            <li key={r.id} className="shrink-0 md:shrink">
              <button
                type="button"
                aria-current={r.id === current.id ? "page" : undefined}
                onClick={() => setParams("research", { item: r.id })}
                className={cn("w-60 rounded-xl px-3 py-2 text-left md:w-full", r.id === current.id ? "bg-accent-soft" : "hover:bg-hover")}
              >
                <span className="line-clamp-2 text-[13px] font-medium text-fg">{r.title}</span>
                <span className="mt-0.5 block text-[11.5px] text-subtle">{STATUS[r.status].label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="scroll-area min-h-0">
        <Study key={current.id} r={current} />
      </div>
    </div>
  );
}

function Study({ r }: { r: Research }) {
  const { open } = useOS();
  const project = r.projectSlug ? getProject(r.projectSlug) : undefined;
  return (
    <article className="mx-auto max-w-3xl px-5 py-5 md:px-7" aria-labelledby={`r-${r.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
        <span className="text-[12.5px] text-subtle">As of {formatDate(r.asOf)}</span>
      </div>
      <h3 id={`r-${r.id}`} className="mt-2 font-display text-[24px] leading-tight font-semibold text-fg">
        {r.title}
      </h3>
      <p className="mt-1 text-[13px] text-muted">{r.statusNote}</p>
      <div className="mt-4 rounded-xl border-l-2 border-accent bg-accent-soft px-4 py-3">
        <p className="text-[11px] font-semibold tracking-wider text-subtle uppercase">Research question</p>
        <p className="mt-0.5 text-[15px] text-fg">{r.question}</p>
      </div>

      <Section title="Abstract" id={`${r.id}-abstract`}>
        <p className="text-[14.5px] leading-relaxed text-fg">{r.abstract}</p>
      </Section>
      {r.relatedWork.length > 0 && (
        <Section title="Related work" id={`${r.id}-related`}>
          <BulletList items={r.relatedWork} />
        </Section>
      )}
      <Section title="Methodology" id={`${r.id}-method`}>
        <BulletList items={r.methodology} />
      </Section>
      <div className="grid gap-x-6 md:grid-cols-2">
        <Section title="Dataset and preprocessing" id={`${r.id}-data`}>
          <BulletList items={r.dataset} />
        </Section>
        <Section title="Experimental setup" id={`${r.id}-setup`}>
          <BulletList items={r.setup} />
        </Section>
      </div>
      <div className="grid gap-x-6 md:grid-cols-2">
        <Section title="Baselines" id={`${r.id}-baselines`}>
          <BulletList items={r.baselines} />
        </Section>
        <Section title="Metrics" id={`${r.id}-metrics`}>
          <BulletList items={r.metrics} />
        </Section>
      </div>

      <Section title="Results" id={`${r.id}-results`}>
        <div className="scroll-area rounded-xl border border-hairline" tabIndex={0} role="region" aria-label="Results table">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <caption className="caption-bottom px-3 py-2 text-left text-[12px] text-subtle">{r.results.caption}</caption>
            <thead className="bg-sunken text-[12px] text-subtle">
              <tr>
                {r.results.columns.map((c, i) => (
                  <th key={c} scope="col" className={cn("px-3 py-2 font-medium", i > 0 && r.results.columns.length > 3 && "text-right")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {r.results.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-3 py-2 font-medium text-fg">
                        {cell}
                      </th>
                    ) : (
                      <td key={i} className={cn("px-3 py-2 text-muted tabular-nums", r.results.columns.length > 3 && "text-right")}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11.5px] font-semibold tracking-wider text-subtle uppercase">Findings</p>
        <BulletList className="mt-1" items={r.results.findings} />
        {r.id === "placement-reevaluation" && (
          <Button className="mt-3" variant="primary" size="sm" onClick={(e) => open("ai-lab", undefined, { trigger: e.currentTarget })}>
            Re-run it in the AI Lab
          </Button>
        )}
      </Section>

      {r.figures.length > 0 && (
        <Section title="Figures" id={`${r.id}-figures`}>
          <div className="space-y-3">
            {r.figures.map((f) => (
              <figure key={f.src} className="overflow-hidden rounded-xl border border-hairline bg-white">
                <Image src={f.src} alt={f.alt} width={f.width} height={f.height} className="h-auto w-full" sizes="(max-width: 800px) 100vw, 720px" />
                {f.caption && <figcaption className="border-t border-hairline bg-[var(--surface-solid)] px-3 py-2 text-[12.5px] text-muted">{f.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      )}

      <Section title="Reproducibility" id={`${r.id}-repro`}>
        <pre tabIndex={0} className="scroll-area rounded-xl border border-hairline bg-[#05080f] p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#d6e2f5]">{r.reproducibility.join("\n\n")}</pre>
      </Section>
      <Section title="Limitations and threats to validity" id={`${r.id}-limits`}>
        <BulletList items={r.limitations} />
      </Section>
      <Section title="Author contributions" id={`${r.id}-contrib`}>
        <p className="text-[14px] text-fg">
          <Txt>{r.contributions}</Txt>
        </p>
      </Section>
      <div className="mt-6 flex flex-wrap gap-2 pb-6">
        {r.links.map((l) => (
          <LinkButton key={l.href} href={l.href} className="h-9">
            {l.label}
          </LinkButton>
        ))}
        {project && <Button onClick={(e) => open("projects", { slug: project.slug }, { trigger: e.currentTarget })}>Project case study</Button>}
      </div>
    </article>
  );
}

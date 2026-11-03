"use client";

import { Database, FlaskConical, Globe, List, Monitor, Network, Server, Workflow } from "lucide-react";
import { useState } from "react";
import { xrayStatusLabels, type XrayNode, type XrayStatus, type XraySystem } from "@/content/xray";
import { Badge, ExternalLink, Toggle } from "@/design/ui";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/os/state/prefs";

const KIND_ICON = { client: Monitor, service: Server, store: Database, external: Globe, research: FlaskConical } as const;

const STATUS_STYLE: Record<XrayStatus, { stroke: string; dash?: string; tone: "success" | "warning" | "neutral" | "info" }> = {
  implemented: { stroke: "var(--accent)", tone: "success" },
  unverified: { stroke: "var(--warning)", dash: "2 6", tone: "warning" },
  simulated: { stroke: "var(--fg-subtle)", dash: "8 6", tone: "neutral" },
  proposed: { stroke: "var(--fg-subtle)", dash: "3 5", tone: "info" },
};

export function XRayDiagram({ system, compact }: { system: XraySystem; compact?: boolean }) {
  const [selected, setSelected] = useState<string>(system.nodes.find((n) => n.kind === "service")?.id ?? system.nodes[0]!.id);
  const [view, setView] = useState<"diagram" | "list">("diagram");
  const [flow, setFlow] = useState(true);
  const reduced = useReducedMotion();
  const node = system.nodes.find((n) => n.id === selected);
  const byId = new Map(system.nodes.map((n) => [n.id, n]));
  const animate = flow && !reduced;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="View" className="flex gap-1 rounded-[12px] bg-sunken p-1">
          {(["diagram", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium", view === v ? "bg-raised text-fg shadow-sm" : "text-muted hover:text-fg")}
            >
              {v === "diagram" ? <Network className="size-3.5" aria-hidden /> : <List className="size-3.5" aria-hidden />}
              {v === "diagram" ? "Diagram" : "List"}
            </button>
          ))}
        </div>
        {view === "diagram" && !reduced && (
          <div className="w-56">
            <Toggle checked={flow} onChange={setFlow} label="Animate data flow" />
          </div>
        )}
        <ul className="ml-auto flex flex-wrap gap-2 text-[12px] text-muted" aria-label="Legend">
          {(Object.keys(STATUS_STYLE) as XrayStatus[]).map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5" title={xrayStatusLabels[s].description}>
              <svg width="26" height="8" aria-hidden>
                <line x1="1" y1="4" x2="25" y2="4" stroke={STATUS_STYLE[s].stroke} strokeWidth="2" strokeDasharray={STATUS_STYLE[s].dash} />
              </svg>
              {xrayStatusLabels[s].label}
            </li>
          ))}
        </ul>
      </div>

      {view === "diagram" ? (
        <div className={cn("@container grid gap-3", !compact && "@5xl:grid-cols-[1fr_300px]")}>
          <div className="@container relative w-full overflow-hidden rounded-2xl border border-hairline bg-[radial-gradient(circle_at_1px_1px,var(--hairline)_1px,transparent_0)] [background-size:22px_22px]" style={{ aspectRatio: "1000 / 560" }}>
            <svg viewBox="0 0 1000 560" className="absolute inset-0 h-full w-full" aria-hidden>
              {system.edges.map((e) => {
                const a = byId.get(e.from)!;
                const b = byId.get(e.to)!;
                const style = STATUS_STYLE[e.status];
                const active = selected === e.from || selected === e.to;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                return (
                  <g key={`${e.from}-${e.to}`} opacity={active ? 1 : 0.45}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={style.stroke} strokeWidth={active ? 2.4 : 1.6} strokeDasharray={style.dash} />
                    {animate && e.status === "implemented" && (
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--accent)" strokeWidth="3" strokeDasharray="4 22" strokeLinecap="round" className="xray-flow" />
                    )}
                    <text x={mx} y={my - 6} textAnchor="middle" fontSize="15" fill="var(--fg-muted)" stroke="var(--surface-solid)" strokeWidth="5" paintOrder="stroke" className="font-sans">
                      {e.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            {system.nodes.map((n) => (
              <NodeButton key={n.id} node={n} selected={n.id === selected} onSelect={() => setSelected(n.id)} />
            ))}
          </div>
          {node && <NodeDetails node={node} system={system} />}
        </div>
      ) : (
        <ListView system={system} />
      )}
    </div>
  );
}

function NodeButton({ node, selected, onSelect }: { node: XrayNode; selected: boolean; onSelect: () => void }) {
  const Icon = KIND_ICON[node.kind];
  const style = STATUS_STYLE[node.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "absolute flex w-[16.5%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-[14px] border bg-[var(--surface-raised)] px-1.5 py-1.5 text-center shadow-md transition-[transform,box-shadow]",
        selected ? "scale-[1.04] border-accent ring-2 ring-accent/50" : "border-hairline-strong hover:scale-[1.03]",
        node.status !== "implemented" && "border-dashed",
      )}
      style={{ left: `${node.x / 10}%`, top: `${(node.y / 560) * 100}%`, borderColor: selected ? undefined : node.status === "implemented" ? undefined : style.stroke }}
    >
      <Icon className="size-[clamp(12px,2cqw,18px)] text-accent-text" aria-hidden />
      <span className="w-full truncate text-[clamp(9px,1.3cqw,13.5px)] leading-tight font-semibold text-fg">{node.label}</span>
      <span className="w-full truncate text-[clamp(8px,1cqw,11px)] leading-tight text-subtle max-[480px]:hidden">{node.tech}</span>
      <span className="sr-only">Status: {xrayStatusLabels[node.status].label}.</span>
    </button>
  );
}

function NodeDetails({ node, system }: { node: XrayNode; system: XraySystem }) {
  const inbound = system.edges.filter((e) => e.to === node.id);
  const outbound = system.edges.filter((e) => e.from === node.id);
  const name = (id: string) => system.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <aside aria-live="polite" aria-label={`${node.label} details`} className="card space-y-3 p-4 text-[13.5px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h5 className="font-display text-[17px] font-semibold text-fg">{node.label}</h5>
          <Badge tone={STATUS_STYLE[node.status].tone}>{xrayStatusLabels[node.status].label}</Badge>
        </div>
        <p className="text-[12.5px] text-subtle">{node.tech}</p>
      </div>
      <p className="leading-relaxed text-fg">{node.responsibility}</p>
      {node.interfaces.length > 0 && <Detail title="Interfaces" items={node.interfaces} />}
      {node.data.length > 0 && <Detail title="Data" items={node.data} />}
      {(inbound.length > 0 || outbound.length > 0) && (
        <Detail
          title="Connections"
          items={[...inbound.map((e) => `← ${name(e.from)}: ${e.label}`), ...outbound.map((e) => `→ ${name(e.to)}: ${e.label}`)]}
        />
      )}
      {node.tests && <Detail title="Tests" items={[node.tests]} />}
      {node.tradeoff && <Detail title="Trade-off" items={[node.tradeoff]} />}
      {node.source && (
        <p>
          <ExternalLink href={node.source}>View source</ExternalLink>
        </p>
      )}
    </aside>
  );
}

function Detail({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold tracking-wider text-subtle uppercase">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.map((i) => (
          <li key={i} className="text-muted">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListView({ system }: { system: XraySystem }) {
  const name = (id: string) => system.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-label="Components" className="space-y-2">
        {system.nodes.map((n) => {
          const Icon = KIND_ICON[n.kind];
          return (
            <article key={n.id} className="card p-3.5">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-accent-text" aria-hidden />
                <h5 className="font-semibold text-fg">{n.label}</h5>
                <Badge tone={STATUS_STYLE[n.status].tone}>{xrayStatusLabels[n.status].label}</Badge>
              </div>
              <p className="text-[12.5px] text-subtle">{n.tech}</p>
              <p className="mt-1 text-[13.5px] text-muted">{n.responsibility}</p>
              {n.source && (
                <p className="mt-1 text-[13px]">
                  <ExternalLink href={n.source}>Source</ExternalLink>
                </p>
              )}
            </article>
          );
        })}
      </section>
      <section aria-label="Connections" className="card h-fit p-4">
        <h5 className="mb-2 flex items-center gap-2 font-semibold text-fg">
          <Workflow className="size-4" aria-hidden /> Connections
        </h5>
        <ul className="space-y-1.5 text-[13.5px]">
          {system.edges.map((e) => (
            <li key={`${e.from}-${e.to}`} className="text-muted">
              <span className="font-medium text-fg">{name(e.from)}</span> → <span className="font-medium text-fg">{name(e.to)}</span>: {e.label}
              {e.status !== "implemented" && <span className="text-subtle"> ({xrayStatusLabels[e.status].label.toLowerCase()})</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

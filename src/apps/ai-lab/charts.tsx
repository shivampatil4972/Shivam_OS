"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Confusion } from "@/lib/ml/metrics";
import { cn } from "@/lib/cn";

/* Charts follow one spec: 2px lines, hairline solid grid, recessive axes,
   text in text tokens (never the series colour), a legend for 2+ series,
   hover AND keyboard tooltips, and a table view for every chart. */

const W = 420;
const H = 250;
const M = { top: 12, right: 14, bottom: 34, left: 44 };

export interface LineSeries {
  name: string;
  color: string;
  points: Array<[number, number]>;
  reference?: boolean;
}

function ticks(min: number, max: number, count = 5) {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export function LineChart({
  title,
  series,
  xLabel,
  yLabel,
  xDomain,
  yDomain,
  formatX = (v) => v.toFixed(2),
  formatY = (v) => v.toFixed(2),
  square,
}: {
  title: string;
  series: LineSeries[];
  xLabel: string;
  yLabel: string;
  xDomain: [number, number];
  yDomain: [number, number];
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  square?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const h = square ? 300 : H;
  const iw = W - M.left - M.right;
  const ih = h - M.top - M.bottom;
  const sx = (x: number) => M.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0] || 1)) * iw;
  const sy = (y: number) => M.top + ih - ((y - yDomain[0]) / (yDomain[1] - yDomain[0] || 1)) * ih;
  const primary = series.find((s) => !s.reference) ?? series[0]!;
  const xs = primary.points.map((p) => p[0]);

  const nearest = (pts: Array<[number, number]>, x: number) => {
    let best = pts[0]!;
    for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
    return best;
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = xDomain[0] + ((px - M.left) / iw) * (xDomain[1] - xDomain[0]);
    setHoverX(nearest(primary.points, Math.min(xDomain[1], Math.max(xDomain[0], x)))[0]);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = hoverX === null ? 0 : xs.indexOf(hoverX);
    const next = Math.min(xs.length - 1, Math.max(0, i + (e.key === "ArrowRight" ? 1 : -1)));
    setHoverX(xs[next] ?? null);
  };

  const readout = hoverX === null ? null : series.map((s) => ({ s, p: nearest(s.points, hoverX) }));
  const tipLeft = hoverX === null ? 0 : (sx(hoverX) / W) * 100;

  return (
    <figure className="min-w-0">
      <figcaption id={`${id}-t`} className="mb-1.5 text-[13px] font-semibold text-fg">
        {title}
      </figcaption>
      {series.length > 1 && (
        <ul className="mb-1 flex flex-wrap gap-3 text-[12px] text-muted" aria-label="Legend">
          {series.map((s) => (
            <li key={s.name} className="inline-flex items-center gap-1.5">
              <svg width="16" height="6" aria-hidden>
                <line x1="0" y1="3" x2="16" y2="3" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
              </svg>
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${h}`}
          className="w-full touch-none overflow-visible rounded-lg outline-offset-2"
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHoverX(null)}
          onKeyDown={onKey}
          onBlur={() => setHoverX(null)}
        >
          {ticks(yDomain[0], yDomain[1]).map((t) => (
            <g key={`y${t}`}>
              <line x1={M.left} x2={W - M.right} y1={sy(t)} y2={sy(t)} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={M.left - 6} y={sy(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--fg-subtle)" className="tabular-nums">
                {formatY(t)}
              </text>
            </g>
          ))}
          {ticks(xDomain[0], xDomain[1]).map((t) => (
            <text key={`x${t}`} x={sx(t)} y={h - M.bottom + 14} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)" className="tabular-nums">
              {formatX(t)}
            </text>
          ))}
          <line x1={M.left} x2={W - M.right} y1={sy(yDomain[0])} y2={sy(yDomain[0])} stroke="var(--chart-axis)" strokeWidth="1" />
          <text x={M.left + iw / 2} y={h - 4} textAnchor="middle" fontSize="10.5" fill="var(--fg-muted)">
            {xLabel}
          </text>
          <text x={12} y={M.top + ih / 2} textAnchor="middle" fontSize="10.5" fill="var(--fg-muted)" transform={`rotate(-90 12 ${M.top + ih / 2})`}>
            {yLabel}
          </text>
          {series.map((s) => (
            <polyline
              key={s.name}
              points={s.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={s.reference ? 1.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {hoverX !== null && (
            <g>
              <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.top} y2={M.top + ih} stroke="var(--chart-axis)" strokeWidth="1" />
              {readout?.map(({ s, p }) => (
                <circle key={s.name} cx={sx(p[0])} cy={sy(p[1])} r="4.5" fill={s.color} stroke="var(--surface-solid)" strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
        {readout && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-hairline bg-raised px-2.5 py-1.5 text-[12px] shadow-lg"
            style={{ left: `${tipLeft}%`, transform: tipLeft > 60 ? "translateX(calc(-100% - 10px))" : "translateX(10px)" }}
            aria-hidden
          >
            <p className="text-subtle">
              {xLabel}: <span className="text-fg tabular-nums">{formatX(hoverX!)}</span>
            </p>
            {readout.map(({ s, p }) => (
              <p key={s.name} className="flex items-center gap-1.5">
                <svg width="10" height="4" aria-hidden>
                  <line x1="0" y1="2" x2="10" y2="2" stroke={s.color} strokeWidth="2" />
                </svg>
                <span className="font-semibold text-fg tabular-nums">{formatY(p[1])}</span>
                <span className="text-muted">{s.name}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <p id={`${id}-d`} className="sr-only">
        {`Use left and right arrow keys to read values. ${series.map((s) => `${s.name}: ${s.points.length} points`).join("; ")}.`}
      </p>
      <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="mt-1 text-[12px] text-accent-text underline underline-offset-2">
        {showTable ? "Hide data table" : "Show data table"}
      </button>
      {showTable && (
        <div className="scroll-area mt-1 max-h-48 rounded-lg border border-hairline" tabIndex={0} role="region" aria-label={`${title} data`}>
          <table className="w-full text-[12px] tabular-nums">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-[var(--surface-raised)] text-subtle">
              <tr>
                <th scope="col" className="px-2 py-1 text-left font-medium">{xLabel}</th>
                {series.map((s) => (
                  <th key={s.name} scope="col" className="px-2 py-1 text-right font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {primary.points.map(([x]) => (
                <tr key={x} className="border-t border-hairline">
                  <th scope="row" className="px-2 py-0.5 text-left font-normal text-muted">{formatX(x)}</th>
                  {series.map((s) => (
                    <td key={s.name} className="px-2 py-0.5 text-right text-fg">
                      {formatY(nearest(s.points, x)[1])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

/** Signed horizontal bars from a shared zero baseline (diverging blue / red). */
export function DivergingBars({ title, rows, positiveLabel, negativeLabel }: { title: string; rows: Array<{ label: string; value: number }>; positiveLabel: string; negativeLabel: string }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)), [rows]);
  const max = Math.max(0.01, ...sorted.map((r) => Math.abs(r.value)));
  const [focus, setFocus] = useState<string | null>(null);
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 text-[13px] font-semibold text-fg">{title}</figcaption>
      <ul className="mb-2 flex flex-wrap gap-3 text-[12px] text-muted" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" aria-hidden />
          {positiveLabel}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-neg)]" aria-hidden />
          {negativeLabel}
        </li>
      </ul>
      <ul className="space-y-0.5" aria-label={title}>
        {sorted.map((r) => {
          const w = (Math.abs(r.value) / max) * 50;
          const pos = r.value >= 0;
          return (
            <li
              key={r.label}
              tabIndex={0}
              aria-label={`${r.label}: ${r.value >= 0 ? "+" : ""}${r.value.toFixed(3)}`}
              onFocus={() => setFocus(r.label)}
              onBlur={() => setFocus(null)}
              onPointerEnter={() => setFocus(r.label)}
              onPointerLeave={() => setFocus(null)}
              className={cn("grid grid-cols-[7.5rem_1fr] items-center gap-2 rounded-md px-1 py-[3px] outline-offset-0", focus === r.label && "bg-hover")}
            >
              <span className="truncate text-right font-mono text-[11.5px] text-muted">{r.label}</span>
              <span className="relative h-4">
                <span className="absolute inset-y-0 left-1/2 w-px bg-[var(--chart-axis)]" aria-hidden />
                <span
                  aria-hidden
                  className="absolute top-1/2 h-3 -translate-y-1/2"
                  style={{
                    left: pos ? "50%" : `${50 - w}%`,
                    width: `${w}%`,
                    background: pos ? "var(--chart-1)" : "var(--chart-neg)",
                    borderRadius: pos ? "0 4px 4px 0" : "4px 0 0 4px",
                  }}
                />
                <span
                  aria-hidden
                  className="absolute top-1/2 -translate-y-1/2 text-[11px] text-fg tabular-nums"
                  style={pos ? { left: `calc(${50 + w}% + 4px)` } : { right: `calc(${50 + w}% + 4px)` }}
                >
                  {r.value >= 0 ? "+" : ""}
                  {r.value.toFixed(2)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** 2×2 confusion matrix; shade = share of the test set, labels inside in the matching ink. */
export function ConfusionMatrix({ title, c, positive = "Placed", negative = "Not placed" }: { title: string; c: Confusion; positive?: string; negative?: string }) {
  const total = c.tp + c.fp + c.tn + c.fn || 1;
  const cell = (value: number, label: string) => {
    const share = value / total;
    const mix = Math.round(Math.min(1, share / 0.6) * 100);
    const dark = mix > 55;
    return (
      <td className="p-0.5">
        <div
          className="flex h-[68px] flex-col items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, var(--seq-hi) ${mix}%, var(--seq-lo))`, color: dark ? "var(--seq-ink-hi)" : "var(--seq-ink-lo)" }}
        >
          <span className="text-[17px] font-semibold tabular-nums">{value.toLocaleString("en-IN")}</span>
          <span className="text-[11px] opacity-85">
            {label} · {(share * 100).toFixed(1)}%
          </span>
        </div>
      </td>
    );
  };
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 text-[13px] font-semibold text-fg">{title}</figcaption>
      <table className="w-full table-fixed text-[12px]">
        <caption className="sr-only">{title}: rows are actual outcomes, columns are predictions</caption>
        <thead>
          <tr>
            <td className="w-24" />
            <th scope="col" className="pb-1 font-medium text-subtle">
              Predicted {positive.toLowerCase()}
            </th>
            <th scope="col" className="pb-1 font-medium text-subtle">
              Predicted {negative.toLowerCase()}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="pr-2 text-right font-medium text-subtle">
              Actually {positive.toLowerCase()}
            </th>
            {cell(c.tp, "TP")}
            {cell(c.fn, "FN")}
          </tr>
          <tr>
            <th scope="row" className="pr-2 text-right font-medium text-subtle">
              Actually {negative.toLowerCase()}
            </th>
            {cell(c.fp, "FP")}
            {cell(c.tn, "TN")}
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

/** Model vs baseline on metrics bounded in [0, 1]. */
export function MetricBars({ title, rows }: { title: string; rows: Array<{ label: string; model: number; baseline: number }> }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 text-[13px] font-semibold text-fg">{title}</figcaption>
      <ul className="mb-2 flex flex-wrap gap-3 text-[12px] text-muted" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" aria-hidden />
          Logistic regression
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-ref)]" aria-hidden />
          Majority-class baseline
        </li>
      </ul>
      <dl className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
            <dt className="text-right text-[12px] text-muted">{r.label}</dt>
            <dd className="space-y-[2px]">
              {(
                [
                  ["Logistic regression", r.model, "var(--chart-1)"],
                  ["Baseline", r.baseline, "var(--chart-ref)"],
                ] as const
              ).map(([name, v, color]) => (
                <span key={name} className="flex items-center gap-1.5" title={`${name}: ${(v * 100).toFixed(1)}%`}>
                  <span className="h-2.5 rounded-r-[4px]" style={{ width: `${Math.max(0.5, v * 82)}%`, background: color }} aria-hidden />
                  <span className="text-[11px] text-fg tabular-nums">
                    <span className="sr-only">{name}: </span>
                    {(v * 100).toFixed(1)}%
                  </span>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

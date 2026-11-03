"use client";

import { AlertTriangle, FlaskConical, Play, RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import canonical from "@/content/placement-experiment.json";
import verification from "@/content/placement-verification.json";
import { Badge, Button, Toggle } from "@/design/ui";
import { cn } from "@/lib/cn";
import { CONFIG_BOUNDS, DEFAULT_CONFIG, NUMERIC_FEATURES, type ExperimentConfig, type NumericFeature } from "@/lib/ml/experiment";
import { useOS } from "@/os/OSContext";
import { BulletList, Section } from "../shared";
import { ConfusionMatrix, DivergingBars, LineChart, MetricBars } from "./charts";
import { useExperiment } from "./useExperiment";

const FEATURE_LABELS: Record<NumericFeature, string> = {
  cgpa: "CGPA",
  internship_count: "Internships",
  project_count: "Projects",
  certification_count: "Certifications",
  skill_count: "Skills",
};

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export default function AILabApp() {
  const { open } = useOS();
  const [config, setConfig] = useState<ExperimentConfig>(DEFAULT_CONFIG);
  const { run, result, running, stage, error } = useExperiment();
  const started = useRef(false);
  const set = <K extends keyof ExperimentConfig>(key: K, value: ExperimentConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  // Run the canonical configuration once so the page opens with real numbers.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run(DEFAULT_CONFIG);
  }, [run]);

  const m = result?.model;
  const b = result?.baseline;
  const leaky = result?.config.includeLeakyFeature;

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[320px_1fr] lg:grid-rows-1">
      <form
        aria-label="Experiment settings"
        className="scroll-area border-b border-hairline p-4 lg:border-r lg:border-b-0 max-lg:max-h-[46vh]"
        onSubmit={(e) => {
          e.preventDefault();
          void run(config);
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="size-5 text-accent-text" aria-hidden />
          <h3 className="font-display text-lg font-semibold text-fg">Experiment</h3>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="mb-1 text-[12px] font-semibold tracking-wider text-subtle uppercase">Features</legend>
          {NUMERIC_FEATURES.map((f) => (
            <Check
              key={f}
              label={FEATURE_LABELS[f]}
              checked={config.features.includes(f)}
              onChange={(on) => set("features", on ? [...config.features, f] : config.features.filter((x) => x !== f))}
            />
          ))}
          <Check label="Branch (one-hot, 6 codes)" checked={config.includeBranch} onChange={(v) => set("includeBranch", v)} />
          <div className={cn("rounded-lg p-2", config.includeLeakyFeature && "bg-warning/10")}>
            <Check label="Generator's latent score (leaky)" checked={config.includeLeakyFeature} onChange={(v) => set("includeLeakyFeature", v)} />
            <p className="mt-1 pl-6 text-[11.5px] text-muted">The label is derived from this column. It would not exist at prediction time.</p>
          </div>
        </fieldset>

        <div className="mt-4 space-y-3">
          <Slider label="Learning rate" value={config.learningRate} min={CONFIG_BOUNDS.learningRate[0]} max={CONFIG_BOUNDS.learningRate[1]} step={0.01} onChange={(v) => set("learningRate", v)} format={(v) => v.toFixed(2)} />
          <Slider label="Epochs" value={config.epochs} min={CONFIG_BOUNDS.epochs[0]} max={CONFIG_BOUNDS.epochs[1]} step={10} onChange={(v) => set("epochs", v)} format={(v) => String(v)} />
          <label className="block text-[13px]">
            <span className="text-fg">L2 regularisation</span>
            <select value={config.l2} onChange={(e) => set("l2", Number(e.target.value))} className="mt-1 h-9 w-full rounded-[var(--radius-control)] border border-hairline bg-sunken px-2 text-[13px] text-fg">
              {[0, 0.0001, 0.001, 0.01, 0.1, 1].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <Slider label="Test split" value={config.testFraction} min={CONFIG_BOUNDS.testFraction[0]} max={CONFIG_BOUNDS.testFraction[1]} step={0.05} onChange={(v) => set("testFraction", v)} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Rows sampled" value={config.sampleSize} min={CONFIG_BOUNDS.sampleSize[0]} max={CONFIG_BOUNDS.sampleSize[1]} step={500} onChange={(v) => set("sampleSize", v)} format={(v) => v.toLocaleString("en-IN")} />
          <Slider label="Decision threshold" value={config.threshold} min={CONFIG_BOUNDS.threshold[0]} max={CONFIG_BOUNDS.threshold[1]} step={0.05} onChange={(v) => set("threshold", v)} format={(v) => v.toFixed(2)} />
          <Toggle checked={config.balanceClasses} onChange={(v) => set("balanceClasses", v)} label="Balance class weights" />
          <div className="flex items-end gap-2">
            <label className="flex-1 text-[13px]">
              <span className="text-fg">Random seed</span>
              <input
                type="number"
                min={CONFIG_BOUNDS.seed[0]}
                max={CONFIG_BOUNDS.seed[1]}
                value={config.seed}
                onChange={(e) => set("seed", Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-[var(--radius-control)] border border-hairline bg-sunken px-2 text-[13px] text-fg tabular-nums"
              />
            </label>
            <Button size="sm" className="h-9" onClick={() => set("seed", 1 + Math.floor(Math.random() * 9998))} aria-label="Random seed">
              <Shuffle className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="submit" variant="primary" className="flex-1" disabled={running}>
            <Play className="size-4" aria-hidden /> {running ? (stage === "loading" ? "Loading data…" : "Training…") : "Run experiment"}
          </Button>
          <Button
            onClick={() => {
              setConfig(DEFAULT_CONFIG);
              void run(DEFAULT_CONFIG);
            }}
            aria-label="Reset to canonical settings and run"
          >
            <RotateCcw className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="mt-2 text-[11.5px] text-subtle">Bounded run: at most 10,000 rows and 2,000 epochs, trained in a Web Worker in your browser.</p>
      </form>

      <div className="scroll-area min-h-0">
        <div className="mx-auto max-w-4xl px-5 py-5 md:px-6">
          <h3 className="font-display text-2xl font-semibold text-fg">AI Experiment Playground</h3>
          <p className="mt-1 text-[14px] text-muted">
            Predict campus placement from the Placement Portal&apos;s own dataset, evaluated on held-out rows against a majority-class baseline.
          </p>
          <div role="note" className="mt-3 flex gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-[13px] text-fg">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>
              <strong>Synthetic data.</strong> All 10,000 rows were produced by the project&apos;s generator script, which flips 10% of labels at random. Results describe that generator — not real students — and no model can exceed about 90% accuracy on it.
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              The experiment could not run: {error}
            </p>
          )}

          {!result && !error && (
            <p className="mt-6 text-[14px] text-muted" role="status">
              Running the canonical experiment…
            </p>
          )}

          {result && m && b && (
            <div className={cn("mt-5 space-y-6 transition-opacity", running && "opacity-60")} aria-busy={running}>
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile label="Test accuracy" value={pct(m.test.accuracy)} hint={`Baseline ${pct(b.test.accuracy)}`} />
                <Tile label="Balanced accuracy" value={pct(m.test.balancedAccuracy)} hint="Baseline 50.0%" />
                <Tile label="ROC-AUC" value={m.test.rocAuc.toFixed(3)} hint="Baseline 0.500" />
                <Tile label="Train / test gap" value={`${((m.train.accuracy - m.test.accuracy) * 100).toFixed(1)} pts`} hint={`Train ${pct(m.train.accuracy)}`} />
              </dl>
              <p className="text-[12.5px] text-subtle">
                {result.split.train.toLocaleString("en-IN")} training rows · {result.split.test.toLocaleString("en-IN")} test rows · {pct(result.split.testPositiveRate)} placed in test · {result.featureNames.length} features ·
                trained in {Math.round(result.runtimeMs)} ms · seed {result.config.seed}
              </p>
              {leaky && (
                <p className="rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-[13px] text-fg">
                  <strong>Leakage on.</strong> The model can see the score the label was computed from. Compare with the run without it: the gain is not learning, it is reading the answer.
                </p>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <MetricBars
                  title="Held-out metrics: model vs baseline"
                  rows={[
                    { label: "Accuracy", model: m.test.accuracy, baseline: b.test.accuracy },
                    { label: "Balanced acc.", model: m.test.balancedAccuracy, baseline: b.test.balancedAccuracy },
                    { label: "Precision", model: m.test.precision, baseline: b.test.precision },
                    { label: "Recall", model: m.test.recall, baseline: b.test.recall },
                    { label: "F1", model: m.test.f1, baseline: b.test.f1 },
                    { label: "ROC-AUC", model: m.test.rocAuc, baseline: b.test.rocAuc },
                  ]}
                />
                <ConfusionMatrix title={`Confusion matrix (threshold ${result.config.threshold.toFixed(2)})`} c={m.test.confusion} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <LineChart
                  title="ROC curve (test set)"
                  square
                  xLabel="False positive rate"
                  yLabel="True positive rate"
                  xDomain={[0, 1]}
                  yDomain={[0, 1]}
                  series={[
                    { name: "Logistic regression", color: "var(--chart-1)", points: m.roc },
                    { name: "Baseline (chance)", color: "var(--chart-ref)", points: b.roc, reference: true },
                  ]}
                />
                <LineChart
                  title="Training loss"
                  square
                  xLabel="Epoch"
                  yLabel="Log loss (regularised)"
                  xDomain={[1, result.config.epochs]}
                  yDomain={[0, Math.max(0.75, ...m.lossCurve.map((p) => p[1]))]}
                  formatX={(v) => String(Math.round(v))}
                  series={[{ name: "Loss", color: "var(--chart-1)", points: m.lossCurve }]}
                />
              </div>

              <DivergingBars
                title="Learned coefficients (standardised features)"
                positiveLabel="Raises predicted placement"
                negativeLabel="Lowers predicted placement"
                rows={m.coefficients.map((c) => ({ label: c.feature, value: c.weight }))}
              />

              <Section title="Things to try" id="ailab-try">
                <BulletList
                  items={[
                    "Untick everything except CGPA: accuracy falls toward the baseline while balanced accuracy shows how little it learns.",
                    "Turn on the leaky latent score and watch metrics jump — then ask whether that column would exist for a new student.",
                    "Balance class weights or move the threshold: recall of 'not placed' students rises, accuracy falls, ROC-AUC barely moves.",
                    "Drop the sample to 500 rows and change the seed a few times to see how much a single split can vary.",
                  ]}
                />
              </Section>

              <Section title="Method and reproducibility" id="ailab-method">
                <BulletList
                  items={[
                    "Stratified train/test split; numeric features standardised with training statistics only; branch one-hot encoded.",
                    "Logistic regression by full-batch gradient descent with L2 regularisation, implemented in TypeScript (src/lib/ml).",
                    `Independent check on ${verification.date}: scikit-learn on the exact same rows reached ROC-AUC ${verification.sklearn.roc_auc} and accuracy ${pct(verification.sklearn.accuracy)} (this implementation: ${canonical.results.features.modelTest.rocAuc} and ${pct(canonical.results.features.modelTest.accuracy)}).`,
                    "Reproduce headlessly: node scripts/placement-experiment.ts — and with scikit-learn: scripts/verify_placement_experiment.py.",
                  ]}
                />
              </Section>
              <Section title="Limitations" id="ailab-limits">
                <BulletList
                  items={[
                    "Synthetic data only; nothing here is evidence about real placements.",
                    "One model family and one split per run; no confidence intervals across seeds.",
                    "The Placement Portal's own ensemble models are not re-trained here.",
                  ]}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={(e) => open("research", { item: "placement-reevaluation" }, { trigger: e.currentTarget })}>
                    Read the write-up
                  </Button>
                  <Button size="sm" onClick={(e) => open("projects", { slug: "placement-prediction-portal" }, { trigger: e.currentTarget })}>
                    Placement Portal case study
                  </Button>
                  <Badge tone="info">Dataset: training_data.csv · 10,000 rows</Badge>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-3">
      <dt className="text-[12px] text-subtle">{label}</dt>
      <dd className="font-display text-[22px] font-semibold text-fg">{value}</dd>
      <dd className="text-[12px] text-muted">{hint}</dd>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13.5px] text-fg">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent-strong)]" />
      {label}
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }): ReactNode {
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <label htmlFor={id} className="text-fg">
          {label}
        </label>
        <output htmlFor={id} className="text-muted tabular-nums">
          {format(value)}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent-strong)]" />
    </div>
  );
}

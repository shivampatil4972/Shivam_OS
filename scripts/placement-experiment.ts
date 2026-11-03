/**
 * Runs the AI Lab's canonical experiment configurations headlessly and prints
 * the metrics used in the Research Lab. Usage: node scripts/placement-experiment.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_CONFIG, runExperiment, splitFor, type ExperimentConfig, type PlacementDataset } from "../src/lib/ml/experiment.ts";

const ds = JSON.parse(readFileSync(new URL("../public/data/placement-training.json", import.meta.url), "utf8")) as PlacementDataset;

const variants: Array<[string, Partial<ExperimentConfig>]> = [
  ["features", {}],
  ["features-balanced", { balanceClasses: true }],
  ["cgpa-only", { features: ["cgpa"], includeBranch: false }],
  ["with-leak", { includeLeakyFeature: true }],
];

const fmt = (x: number) => Math.round(x * 10000) / 10000;
const out: Record<string, unknown> = { generatedAt: new Date().toISOString().slice(0, 10), dataset: ds.source, rows: ds.rows, results: {} };
for (const [name, patch] of variants) {
  const r = runExperiment(ds, { ...DEFAULT_CONFIG, ...patch });
  const pick = (m: typeof r.model.test) => ({ accuracy: fmt(m.accuracy), balancedAccuracy: fmt(m.balancedAccuracy), precision: fmt(m.precision), recall: fmt(m.recall), f1: fmt(m.f1), rocAuc: fmt(m.rocAuc), logLoss: fmt(m.logLoss), confusion: m.confusion });
  (out.results as Record<string, unknown>)[name] = {
    config: patch,
    split: r.split,
    baselineTest: pick(r.baseline.test),
    modelTest: pick(r.model.test),
    modelTrain: { accuracy: fmt(r.model.train.accuracy), rocAuc: fmt(r.model.train.rocAuc) },
    coefficients: r.model.coefficients.map((c) => [c.feature, fmt(c.weight)]),
    runtimeMs: Math.round(r.runtimeMs),
  };
}
const splitArg = process.argv.indexOf("--export-split");
if (splitArg > 0 && process.argv[splitArg + 1]) {
  writeFileSync(process.argv[splitArg + 1]!, JSON.stringify(splitFor(ds, DEFAULT_CONFIG)));
}
const json = JSON.stringify(out, null, 2);
if (process.argv.includes("--write")) writeFileSync(new URL("../src/content/placement-experiment.json", import.meta.url), json + "\n");
console.log(json);

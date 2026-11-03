import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import canonical from "@/content/placement-experiment.json";
import verification from "@/content/placement-verification.json";
import { CONFIG_BOUNDS, DEFAULT_CONFIG, clampConfig, runExperiment, splitFor, stratifiedSplit, type PlacementDataset } from "@/lib/ml/experiment";
import { classificationMetrics, confusionAt, rocAuc, rocCurve } from "@/lib/ml/metrics";
import { createRng, shuffledIndices } from "@/lib/ml/rng";

const dataset = JSON.parse(readFileSync(path.join(process.cwd(), "public/data/placement-training.json"), "utf8")) as PlacementDataset;

describe("metrics", () => {
  it("computes a confusion matrix at a threshold", () => {
    expect(confusionAt([1, 1, 0, 0], [0.9, 0.2, 0.8, 0.1], 0.5)).toEqual({ tp: 1, fn: 1, fp: 1, tn: 1 });
  });

  it("computes ROC-AUC for perfect, inverted and tied scores", () => {
    expect(rocAuc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])).toBe(1);
    expect(rocAuc([0, 0, 1, 1], [0.9, 0.8, 0.2, 0.1])).toBe(0);
    expect(rocAuc([0, 0, 1, 1], [0.5, 0.5, 0.5, 0.5])).toBe(0.5);
    expect(rocAuc([1, 1], [0.1, 0.2])).toBe(0.5);
  });

  it("matches a hand-computed ROC-AUC with ties", () => {
    // Positives 0.8, 0.5; negatives 0.5, 0.2 → pairs: (0.8>0.5)=1, (0.8>0.2)=1, (0.5=0.5)=0.5, (0.5>0.2)=1 → 3.5/4.
    expect(rocAuc([1, 1, 0, 0], [0.8, 0.5, 0.5, 0.2])).toBeCloseTo(0.875, 10);
  });

  it("computes precision, recall, F1 and balanced accuracy", () => {
    const m = classificationMetrics([1, 1, 1, 0], [0.9, 0.9, 0.1, 0.1], 0.5);
    expect(m.accuracy).toBeCloseTo(0.75);
    expect(m.precision).toBe(1);
    expect(m.recall).toBeCloseTo(2 / 3);
    expect(m.specificity).toBe(1);
    expect(m.balancedAccuracy).toBeCloseTo((2 / 3 + 1) / 2);
    expect(m.f1).toBeCloseTo(0.8);
  });

  it("never divides by zero", () => {
    const m = classificationMetrics([0, 0], [0.1, 0.2], 0.5);
    expect(m.precision).toBe(0);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
    expect(Number.isFinite(m.logLoss)).toBe(true);
  });

  it("draws a ROC curve from (0,0) to (1,1) that never decreases", () => {
    const curve = rocCurve([1, 0, 1, 0, 1, 0], [0.9, 0.8, 0.7, 0.3, 0.2, 0.1]);
    expect(curve[0]).toEqual([0, 0]);
    expect(curve[curve.length - 1]).toEqual([1, 1]);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]![0]).toBeGreaterThanOrEqual(curve[i - 1]![0]);
      expect(curve[i]![1]).toBeGreaterThanOrEqual(curve[i - 1]![1]);
    }
  });
});

describe("seeded randomness", () => {
  it("is deterministic for a seed and differs between seeds", () => {
    const a = createRng(7);
    const b = createRng(7);
    const c = createRng(8);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
  });

  it("shuffles to a permutation", () => {
    const s = shuffledIndices(100, createRng(1));
    expect([...s].sort((x, y) => x - y)).toEqual(Array.from({ length: 100 }, (_, i) => i));
  });
});

describe("stratified split", () => {
  const labels = Array.from({ length: 1000 }, (_, i) => (i % 10 < 3 ? 1 : 0));
  const indices = labels.map((_, i) => i);

  it("partitions the rows with no overlap", () => {
    const { train, test } = stratifiedSplit(labels, indices, 0.2, 1);
    expect(train.length + test.length).toBe(1000);
    expect(new Set([...train, ...test]).size).toBe(1000);
    expect(test.length).toBe(200);
  });

  it("preserves the class balance", () => {
    const { test } = stratifiedSplit(labels, indices, 0.2, 1);
    expect(test.filter((i) => labels[i] === 1).length).toBe(60);
  });

  it("is deterministic for a seed", () => {
    expect(stratifiedSplit(labels, indices, 0.2, 1)).toEqual(stratifiedSplit(labels, indices, 0.2, 1));
    expect(stratifiedSplit(labels, indices, 0.2, 1).test).not.toEqual(stratifiedSplit(labels, indices, 0.2, 2).test);
  });
});

describe("configuration bounds", () => {
  it("clamps every parameter into its allowed range", () => {
    const c = clampConfig({ ...DEFAULT_CONFIG, epochs: 1e9, learningRate: 100, sampleSize: 1e9, testFraction: 0.99, threshold: 2, seed: -5, l2: 50 });
    expect(c.epochs).toBe(CONFIG_BOUNDS.epochs[1]);
    expect(c.learningRate).toBe(CONFIG_BOUNDS.learningRate[1]);
    expect(c.sampleSize).toBe(CONFIG_BOUNDS.sampleSize[1]);
    expect(c.testFraction).toBe(CONFIG_BOUNDS.testFraction[1]);
    expect(c.threshold).toBe(CONFIG_BOUNDS.threshold[1]);
    expect(c.seed).toBe(CONFIG_BOUNDS.seed[0]);
    expect(c.l2).toBe(CONFIG_BOUNDS.l2[1]);
  });

  it("handles non-finite input", () => {
    expect(clampConfig({ ...DEFAULT_CONFIG, epochs: Number.NaN }).epochs).toBe(CONFIG_BOUNDS.epochs[0]);
  });

  it("drops unknown feature names", () => {
    expect(clampConfig({ ...DEFAULT_CONFIG, features: ["cgpa", "__proto__" as never] }).features).toEqual(["cgpa"]);
  });
});

describe("the experiment on the real dataset", () => {
  it("rejects a configuration with no features", () => {
    expect(() => runExperiment(dataset, { ...DEFAULT_CONFIG, features: [], includeBranch: false, includeLeakyFeature: false })).toThrow("at least one feature");
  });

  it("is deterministic for a seed", () => {
    const small = { ...DEFAULT_CONFIG, sampleSize: 1000, epochs: 50 };
    const a = runExperiment(dataset, small);
    const b = runExperiment(dataset, small);
    expect(a.model.test).toEqual(b.model.test);
    expect(a.model.coefficients).toEqual(b.model.coefficients);
  });

  it("reproduces the published canonical result exactly", () => {
    const r = runExperiment(dataset, DEFAULT_CONFIG);
    const pub = canonical.results.features;
    expect(r.split).toMatchObject({ train: pub.split.train, test: pub.split.test });
    expect(Number(r.model.test.accuracy.toFixed(4))).toBe(pub.modelTest.accuracy);
    expect(Number(r.model.test.rocAuc.toFixed(4))).toBe(pub.modelTest.rocAuc);
    expect(r.model.test.confusion).toEqual(pub.modelTest.confusion);
    expect(Number(r.baseline.test.accuracy.toFixed(4))).toBe(pub.baselineTest.accuracy);
  });

  it("agrees with the independent scikit-learn check on the same rows", () => {
    const r = runExperiment(dataset, DEFAULT_CONFIG);
    expect(verification.rows).toEqual({ train: r.split.train, test: r.split.test });
    expect(Math.abs(r.model.test.rocAuc - verification.sklearn.roc_auc)).toBeLessThan(0.002);
    expect(Math.abs(r.model.test.accuracy - verification.sklearn.accuracy)).toBeLessThan(0.005);
    expect(Math.abs(r.model.test.f1 - verification.sklearn.f1)).toBeLessThan(0.005);
    expect(r.baseline.test.accuracy).toBeCloseTo(verification.sklearn.baseline_accuracy, 3);
  });

  it("beats the majority baseline, whose ROC-AUC is 0.5", () => {
    const r = runExperiment(dataset, { ...DEFAULT_CONFIG, epochs: 200 });
    expect(r.baseline.predictsClass).toBe(1);
    expect(r.baseline.test.rocAuc).toBe(0.5);
    expect(r.baseline.test.balancedAccuracy).toBe(0.5);
    expect(r.model.test.accuracy).toBeGreaterThan(r.baseline.test.accuracy + 0.1);
  });

  it("never exceeds the ~90% ceiling set by the 10% label flips, even with leakage", () => {
    const r = runExperiment(dataset, { ...DEFAULT_CONFIG, includeLeakyFeature: true });
    expect(r.model.test.accuracy).toBeLessThan(0.92);
    const clean = runExperiment(dataset, DEFAULT_CONFIG);
    expect(r.model.test.accuracy).toBeGreaterThan(clean.model.test.accuracy);
  });

  it("standardises using training rows only", () => {
    const split = splitFor(dataset, DEFAULT_CONFIG);
    expect(new Set(split.train).size).toBe(split.train.length);
    expect(split.train.some((i) => split.test.includes(i))).toBe(false);
  });

  it("the dataset is what the documentation says it is", () => {
    expect(dataset.rows).toBe(10000);
    expect(dataset.synthetic).toBe(true);
    const placed = dataset.data.placed!.reduce((s, v) => s + v, 0) / dataset.rows;
    expect(placed).toBeCloseTo(0.6697, 3);
  });
});

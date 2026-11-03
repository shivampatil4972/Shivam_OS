import { classificationMetrics, rocCurve, type ClassificationMetrics } from "./metrics.ts";
import { createRng, shuffledIndices } from "./rng.ts";

/** Columnar dataset as stored in /public/data/placement-training.json. */
export interface PlacementDataset {
  name: string;
  source: string;
  synthetic: boolean;
  rows: number;
  columns: string[];
  data: Record<string, number[]>;
}

export const NUMERIC_FEATURES = [
  "cgpa",
  "internship_count",
  "project_count",
  "certification_count",
  "skill_count",
] as const;
export type NumericFeature = (typeof NUMERIC_FEATURES)[number];

/** The generator's latent score. It determines the label, so using it is target leakage. */
export const LEAKY_FEATURE = "placement_probability";

export interface ExperimentConfig {
  seed: number;
  /** Fraction of rows held out for testing (stratified). */
  testFraction: number;
  /** Number of rows sampled from the dataset before splitting. */
  sampleSize: number;
  features: NumericFeature[];
  includeBranch: boolean;
  includeLeakyFeature: boolean;
  learningRate: number;
  epochs: number;
  l2: number;
  balanceClasses: boolean;
  threshold: number;
}

export const DEFAULT_CONFIG: ExperimentConfig = {
  seed: 42,
  testFraction: 0.2,
  sampleSize: 10000,
  features: [...NUMERIC_FEATURES],
  includeBranch: true,
  includeLeakyFeature: false,
  learningRate: 0.5,
  epochs: 400,
  l2: 0.001,
  balanceClasses: false,
  threshold: 0.5,
};

/** Bounds keep every run small enough to finish in the browser in well under a second. */
export const CONFIG_BOUNDS = {
  seed: [1, 9999],
  testFraction: [0.1, 0.5],
  sampleSize: [500, 10000],
  learningRate: [0.01, 2],
  epochs: [10, 2000],
  l2: [0, 1],
  threshold: [0.05, 0.95],
} as const;

export function clampConfig(config: ExperimentConfig): ExperimentConfig {
  const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
  return {
    ...config,
    seed: Math.round(clamp(config.seed, CONFIG_BOUNDS.seed)),
    testFraction: clamp(config.testFraction, CONFIG_BOUNDS.testFraction),
    sampleSize: Math.round(clamp(config.sampleSize, CONFIG_BOUNDS.sampleSize)),
    learningRate: clamp(config.learningRate, CONFIG_BOUNDS.learningRate),
    epochs: Math.round(clamp(config.epochs, CONFIG_BOUNDS.epochs)),
    l2: clamp(config.l2, CONFIG_BOUNDS.l2),
    threshold: clamp(config.threshold, CONFIG_BOUNDS.threshold),
    features: config.features.filter((f): f is NumericFeature => (NUMERIC_FEATURES as readonly string[]).includes(f)),
  };
}

export interface ModelResult {
  test: ClassificationMetrics;
  train: ClassificationMetrics;
  roc: Array<[number, number]>;
}

export interface ExperimentResult {
  config: ExperimentConfig;
  featureNames: string[];
  split: { train: number; test: number; trainPositiveRate: number; testPositiveRate: number };
  baseline: ModelResult & { predictsClass: 0 | 1 };
  model: ModelResult & {
    coefficients: Array<{ feature: string; weight: number }>;
    intercept: number;
    lossCurve: Array<[number, number]>;
  };
  runtimeMs: number;
}

interface Matrix {
  x: Float64Array[];
  y: Uint8Array;
}

/** Stratified split: the same class balance in train and test, deterministic for a seed. */
export function stratifiedSplit(labels: ArrayLike<number>, indices: number[], testFraction: number, seed: number) {
  const rng = createRng(seed ^ 0x9e3779b9);
  const pos = indices.filter((i) => labels[i] === 1);
  const neg = indices.filter((i) => labels[i] !== 1);
  const take = (group: number[]) => {
    const order = shuffledIndices(group.length, rng).map((k) => group[k]!);
    const nTest = Math.round(group.length * testFraction);
    return { test: order.slice(0, nTest), train: order.slice(nTest) };
  };
  const p = take(pos);
  const n = take(neg);
  return { train: [...p.train, ...n.train], test: [...p.test, ...n.test] };
}

function buildMatrix(
  ds: PlacementDataset,
  rows: number[],
  config: ExperimentConfig,
  stats: { mean: number[]; std: number[] } | null,
): { matrix: Matrix; names: string[]; stats: { mean: number[]; std: number[] } } {
  const numeric: string[] = [...config.features];
  if (config.includeLeakyFeature) numeric.push(LEAKY_FEATURE);
  const branches = [0, 1, 2, 3, 4, 5];
  const names = [...numeric, ...(config.includeBranch ? branches.map((b) => `branch_${b}`) : [])];

  const columns = numeric.map((c) => {
    const col = ds.data[c];
    if (!col) throw new Error(`Dataset is missing column ${c}`);
    return col;
  });

  // Standardise numeric columns with training-set statistics only.
  const computed =
    stats ??
    (() => {
      const mean = columns.map((col) => rows.reduce((s, r) => s + col[r]!, 0) / Math.max(1, rows.length));
      const std = columns.map((col, j) => {
        const v = rows.reduce((s, r) => s + (col[r]! - mean[j]!) ** 2, 0) / Math.max(1, rows.length);
        return Math.sqrt(v) || 1;
      });
      return { mean, std };
    })();

  const branchCol = ds.data.branch_code;
  const label = ds.data.placed;
  if (!label) throw new Error("Dataset is missing column placed");
  const x = rows.map((r) => {
    const row = new Float64Array(names.length);
    columns.forEach((col, j) => {
      row[j] = (col[r]! - computed.mean[j]!) / computed.std[j]!;
    });
    if (config.includeBranch && branchCol) {
      const b = branchCol[r]!;
      const k = branches.indexOf(b);
      if (k >= 0) row[numeric.length + k] = 1;
    }
    return row;
  });
  const y = Uint8Array.from(rows, (r) => (label[r]! >= 0.5 ? 1 : 0));
  return { matrix: { x, y }, names, stats: computed };
}

const sigmoid = (z: number) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

/** Full-batch gradient descent on L2-regularised (optionally class-weighted) log loss. */
export function trainLogistic(m: Matrix, config: Pick<ExperimentConfig, "learningRate" | "epochs" | "l2" | "balanceClasses">) {
  const n = m.x.length;
  const d = m.x[0]?.length ?? 0;
  const w = new Float64Array(d);
  let b = 0;
  let nPos = 0;
  for (let i = 0; i < n; i++) nPos += m.y[i]!;
  const wPos = config.balanceClasses && nPos > 0 ? n / (2 * nPos) : 1;
  const wNeg = config.balanceClasses && n - nPos > 0 ? n / (2 * (n - nPos)) : 1;
  const lossCurve: Array<[number, number]> = [];
  const every = Math.max(1, Math.floor(config.epochs / 50));
  const gw = new Float64Array(d);

  for (let epoch = 0; epoch < config.epochs; epoch++) {
    gw.fill(0);
    let gb = 0;
    let loss = 0;
    for (let i = 0; i < n; i++) {
      const row = m.x[i]!;
      let z = b;
      for (let j = 0; j < d; j++) z += w[j]! * row[j]!;
      const p = sigmoid(z);
      const y = m.y[i]!;
      const cw = y === 1 ? wPos : wNeg;
      const err = (p - y) * cw;
      for (let j = 0; j < d; j++) gw[j]! += err * row[j]!;
      gb += err;
      if (epoch % every === 0 || epoch === config.epochs - 1) {
        const pc = Math.min(1 - 1e-12, Math.max(1e-12, p));
        loss -= cw * (y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
      }
    }
    for (let j = 0; j < d; j++) w[j]! -= config.learningRate * (gw[j]! / n + config.l2 * w[j]!);
    b -= config.learningRate * (gb / n);
    if (epoch % every === 0 || epoch === config.epochs - 1) {
      let reg = 0;
      for (let j = 0; j < d; j++) reg += w[j]! ** 2;
      lossCurve.push([epoch + 1, loss / n + (config.l2 / 2) * reg]);
    }
  }
  return { weights: w, intercept: b, lossCurve };
}

function predict(m: Matrix, weights: Float64Array, intercept: number): Float64Array {
  return Float64Array.from(m.x, (row) => {
    let z = intercept;
    for (let j = 0; j < row.length; j++) z += weights[j]! * row[j]!;
    return sigmoid(z);
  });
}

/** The exact row indices a configuration trains and tests on (exported for independent verification). */
export function splitFor(ds: PlacementDataset, config: ExperimentConfig): { train: number[]; test: number[] } {
  const label = ds.data.placed;
  if (!label) throw new Error("Dataset is missing column placed");
  const sampleRng = createRng(config.seed);
  const all = shuffledIndices(ds.rows, sampleRng).slice(0, Math.min(config.sampleSize, ds.rows));
  return stratifiedSplit(label, all, config.testFraction, config.seed);
}

export function runExperiment(ds: PlacementDataset, input: ExperimentConfig): ExperimentResult {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const config = clampConfig(input);
  if (config.features.length === 0 && !config.includeBranch && !config.includeLeakyFeature) {
    throw new Error("Select at least one feature.");
  }
  const label = ds.data.placed;
  if (!label) throw new Error("Dataset is missing column placed");

  const { train, test } = splitFor(ds, config);

  const tr = buildMatrix(ds, train, config, null);
  const te = buildMatrix(ds, test, config, tr.stats);

  const fit = trainLogistic(tr.matrix, config);
  const pTrain = predict(tr.matrix, fit.weights, fit.intercept);
  const pTest = predict(te.matrix, fit.weights, fit.intercept);

  // Majority-class baseline learned from the training split.
  const trainPos = tr.matrix.y.reduce((s, v) => s + v, 0) / Math.max(1, tr.matrix.y.length);
  const testPos = te.matrix.y.reduce((s, v) => s + v, 0) / Math.max(1, te.matrix.y.length);
  const majority: 0 | 1 = trainPos >= 0.5 ? 1 : 0;
  const constantProb = (n: number) => new Float64Array(n).fill(trainPos);
  // The baseline predicts the majority class; its probability is the training positive rate.
  const baselineThreshold = majority === 1 ? 0 : 1.01;

  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    config,
    featureNames: tr.names,
    split: { train: train.length, test: test.length, trainPositiveRate: trainPos, testPositiveRate: testPos },
    baseline: {
      predictsClass: majority,
      test: classificationMetrics(te.matrix.y, constantProb(te.matrix.y.length), baselineThreshold),
      train: classificationMetrics(tr.matrix.y, constantProb(tr.matrix.y.length), baselineThreshold),
      roc: [
        [0, 0],
        [1, 1],
      ],
    },
    model: {
      test: classificationMetrics(te.matrix.y, pTest, config.threshold),
      train: classificationMetrics(tr.matrix.y, pTrain, config.threshold),
      roc: rocCurve(te.matrix.y, pTest),
      coefficients: tr.names.map((feature, j) => ({ feature, weight: fit.weights[j]! })),
      intercept: fit.intercept,
      lossCurve: fit.lossCurve,
    },
    runtimeMs: ended - started,
  };
}

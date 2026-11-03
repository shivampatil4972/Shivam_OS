export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ClassificationMetrics {
  confusion: Confusion;
  accuracy: number;
  balancedAccuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  rocAuc: number;
  logLoss: number;
  brier: number;
  n: number;
}

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function confusionAt(labels: ArrayLike<number>, probs: ArrayLike<number>, threshold: number): Confusion {
  const c: Confusion = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (let i = 0; i < labels.length; i++) {
    const pred = probs[i]! >= threshold ? 1 : 0;
    const y = labels[i]!;
    if (pred === 1 && y === 1) c.tp++;
    else if (pred === 1 && y === 0) c.fp++;
    else if (pred === 0 && y === 0) c.tn++;
    else c.fn++;
  }
  return c;
}

/**
 * ROC-AUC via the Mann–Whitney U statistic, with average ranks for ties.
 * Returns 0.5 when only one class is present or all scores are tied.
 */
export function rocAuc(labels: ArrayLike<number>, scores: ArrayLike<number>): number {
  const n = labels.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[a]! - scores[b]!);
  const ranks = new Float64Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && scores[order[j + 1]!] === scores[order[i]!]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k]!] = avg;
    i = j + 1;
  }
  let nPos = 0;
  let rankSumPos = 0;
  for (let k = 0; k < n; k++) {
    if (labels[k] === 1) {
      nPos++;
      rankSumPos += ranks[k]!;
    }
  }
  const nNeg = n - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

/** ROC curve points (fpr, tpr) at up to `maxPoints` thresholds, always including (0,0) and (1,1). */
export function rocCurve(labels: ArrayLike<number>, scores: ArrayLike<number>, maxPoints = 60): Array<[number, number]> {
  const n = labels.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[b]! - scores[a]!);
  let P = 0;
  for (let k = 0; k < n; k++) if (labels[k] === 1) P++;
  const N = n - P;
  if (P === 0 || N === 0) return [[0, 0], [1, 1]];
  const pts: Array<[number, number]> = [[0, 0]];
  let tp = 0;
  let fp = 0;
  const step = Math.max(1, Math.floor(n / maxPoints));
  for (let k = 0; k < n; k++) {
    if (labels[order[k]!] === 1) tp++;
    else fp++;
    const nextTied = k + 1 < n && scores[order[k + 1]!] === scores[order[k]!];
    if (!nextTied && (k % step === 0 || k === n - 1)) pts.push([fp / N, tp / P]);
  }
  const last = pts[pts.length - 1]!;
  if (last[0] !== 1 || last[1] !== 1) pts.push([1, 1]);
  return pts;
}

export function classificationMetrics(
  labels: ArrayLike<number>,
  probs: ArrayLike<number>,
  threshold = 0.5,
): ClassificationMetrics {
  const confusion = confusionAt(labels, probs, threshold);
  const { tp, fp, tn, fn } = confusion;
  const n = labels.length;
  const precision = safeDiv(tp, tp + fp);
  const recall = safeDiv(tp, tp + fn);
  const specificity = safeDiv(tn, tn + fp);
  let logLoss = 0;
  let brier = 0;
  const eps = 1e-12;
  for (let i = 0; i < n; i++) {
    const p = Math.min(1 - eps, Math.max(eps, probs[i]!));
    const y = labels[i]!;
    logLoss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);
    brier += (probs[i]! - y) ** 2;
  }
  return {
    confusion,
    accuracy: safeDiv(tp + tn, n),
    balancedAccuracy: (recall + specificity) / 2,
    precision,
    recall,
    specificity,
    f1: safeDiv(2 * precision * recall, precision + recall),
    rocAuc: rocAuc(labels, probs),
    logLoss: safeDiv(logLoss, n),
    brier: safeDiv(brier, n),
    n,
  };
}

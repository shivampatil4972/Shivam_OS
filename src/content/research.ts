import experiment from "./placement-experiment.json";
import verification from "./placement-verification.json";
import { placeholder } from "./placeholder";
import type { Research } from "./schema";

const vayora = "https://github.com/shivampatil4972/VAYORA-";
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const r = experiment.results;

export const researchItems: Research[] = [
  {
    id: "journex-durability",
    title: "Does acting on predicted booking durability increase completed intercity rides?",
    question:
      "If a ride-sharing platform predicts how long each accepted booking will last and asks passengers with shaky bookings to release their seats early, do more people actually travel?",
    status: "unpublished-project-research",
    statusNote: "Research component of the JOURNEX final-year project (team of four). Not submitted to a venue. All results are from a simulation.",
    projectSlug: "journex",
    abstract:
      "On an intercity corridor, a seat released days before departure is usually refilled while a late release destroys capacity. We model booking durability as a survival curve over a seven-day horizon (Cox proportional hazards, with gradient-boosted and Kaplan–Meier comparators) and compare a ladder of platform policies in a SimPy simulation of the Kolhapur–Pune corridor: ranking rides by predicted durability (B3), asking shaky bookings to release early (B4), doing so under a CP-SAT contact budget (B5), and an oracle that asks exactly the late cancellers. On the primary metric — completed rides per 100 searches, over 30 seeds per variant with seed-paired 95% intervals — ranking gains +0.34, asking adds nothing measurable, and even the oracle adds only about +0.10, because late releases are mostly refilled anyway and supply, not timing, is what runs out. On a public hotel-cancellation dataset the same model kinds do gain from booking features, suggesting the simulated world understates what features can tell.",
    relatedWork: [
      "Survival analysis with right-censoring; the Cox proportional-hazards model (Cox, 1972), fitted with the lifelines library.",
      "Antonio, de Almeida & Nunes (2019), Hotel booking demand datasets, Data in Brief 22, 41–49 — used as the only real-data check.",
      placeholder("Add the related work on ride-sharing cancellations and overbooking that the team reviewed."),
    ],
    methodology: [
      "Target: time from acceptance until passenger cancellation; bookings live at departure are right-censored at departure, driver withdrawals at withdrawal.",
      "Features (version f1) are only those known at request time, computed by one tracker that replays logged events — the same code for training and serving.",
      "Variants differ in one thing at a time (e.g., B5 keeps B4's threshold and adds only a budget), compared to the baseline by seed-paired differences.",
      "Robustness checks: a model with no booking features, asking alone, random choice of whom to ask, and every survival threshold tried.",
    ],
    dataset: [
      "Synthetic: simulator output from experiments/configs/world.yaml; every parameter is an assumption chosen to be plausible, none estimated from data.",
      "Latent passenger types drive behaviour in the simulator and are never model features.",
      "Real check: public hotel bookings (CC BY 4.0), downloaded and verified by SHA-256; trained on 2015–16 arrivals, checked on 2017.",
    ],
    setup: [
      "60 simulated days per run; 30 seeds per variant; training and validation on disjoint seeds.",
      "Every threshold, budget and assumed value lives in YAML configs, none in code.",
      "Every reported number is a SQL aggregate over one events table (experiments/analysis/metrics.sql).",
    ],
    baselines: ["B0: show rides closest to the passenger's preferred time.", "ORACLE: an upper bound that asks exactly the bookings that will cancel late."],
    metrics: ["Primary: completed rides per 100 searches.", "Secondary: share of late cancellations, refill rates of early vs late releases, concordance and Brier score for the model."],
    results: {
      caption: "Completed rides per 100 searches, 30 seeds per variant (synthetic corridor). Source: repository README and docs/figures.",
      columns: ["Variant", "Policy", "Completed rides / 100 searches"],
      rows: [
        ["B0", "Rides closest to preferred time", "30.77"],
        ["B3", "Rank by predicted durability", "31.11 (+0.34 vs B0)"],
        ["B4", "B3 + ask shaky bookings to release", "31.10 (−0.01 vs B3; 95% CI −0.04 to +0.03)"],
        ["B5", "B4 within a CP-SAT contact budget", "31.10"],
        ["ORACLE", "Ask exactly the late cancellers", "+0.44 vs B0 (+0.10 vs B3)"],
      ],
      findings: [
        "The central hypothesis is not supported on the primary metric in this simulated world.",
        "Asking works on timing but not on rides: B4 cuts the late-cancellation share by 5.6 points.",
        "Late releases are already refilled 68% of the time (94% for early ones), and over half of searches find no ride — supply, not timing, binds.",
        "B3's gain needs no personal data: a model knowing only time to departure does as well; the scheduler does no better than random choice.",
        "On real hotel cancellations, features help: concordance 0.597 (Cox) and 0.653 (gradient boosting) vs 0.544 for lead time alone.",
      ],
    },
    figures: [
      { src: "/research/journex/fig1-ladder.webp", alt: "Bar chart of each variant's change in completed rides per 100 searches against B0, with 95% intervals", width: 1280, height: 580, caption: "Figure 1 — the variant ladder (run 7a1c0de0-…-003)." },
      { src: "/research/journex/fig2-refill-timing.webp", alt: "Bars comparing the refill share of early and late seat releases", width: 1280, height: 680, caption: "Figure 2 — early releases are refilled far more often, but late ones two times in three." },
      { src: "/research/journex/fig4-survival.webp", alt: "Kaplan–Meier curve of the share of bookings not yet cancelled by days since booking", width: 1280, height: 680, caption: "Figure 4 — booking durability (training seeds only)." },
    ],
    reproducibility: [
      "scripts/reproduce.sh rebuilds every result from experiments/configs and fails unless each matches what is committed (about an hour; --no-sweeps for tests, model and ladder only).",
      "docker compose --profile research run --rm research python -m experiments.hazard.train",
      "docker compose --profile research run --rm research python -m sim.run --variant experiments/configs/variants/B4.yaml",
    ],
    limitations: [
      "One synthetic corridor; demand is assumed, not calibrated. It is not evidence that the idea fails in reality.",
      "The served model discriminates weakly (concordance ≈ 0.59) and violates proportional hazards for lead time.",
      "Variants B1, B2 and B6–B11 are not built.",
      "The explanation for why refills add no rides is an upper-bound argument from means, not a paired test.",
    ],
    contributions: "Team of four. " + placeholder("State your own contribution to the research (model, simulator, experiments, analysis or writing)."),
    links: [
      { label: "Experiment protocol", href: `${vayora}/blob/HEAD/docs/EXPERIMENT_PROTOCOL.md`, kind: "report" },
      { label: "AI/ML methodology", href: `${vayora}/blob/HEAD/docs/AI_ML_METHODOLOGY.md`, kind: "docs" },
      { label: "Dataset documentation", href: `${vayora}/blob/HEAD/docs/DATASET_DOCUMENTATION.md`, kind: "docs" },
      { label: "Repository", href: vayora, kind: "repo" },
    ],
    asOf: "2026-10-24",
  },
  {
    id: "placement-reevaluation",
    title: "Re-evaluating a placement-prediction model: baselines, label noise and leakage",
    question: "How good is the Placement Portal's placement model once it is evaluated on held-out data against a trivial baseline?",
    status: "internal-report",
    statusNote: "Portfolio analysis carried out for this site on 2026-10-25, reproducible in the AI Lab.",
    projectSlug: "placement-prediction-portal",
    abstract:
      `The Placement Portal's reports quote 95.11% test accuracy and an in-sample ROC-AUC of 0.978. Both come from synthetic data whose placement rate is 96.5–97.6%, so always predicting "placed" would score about the same — the quoted accuracy is in fact below that trivial baseline. Re-running the problem on the project's 10,000-row synthetic dataset (67% positive) with a stratified 80/20 split, a majority-class baseline scores ${pct(r.features.baselineTest.accuracy)} accuracy and 0.50 ROC-AUC, while L2-regularised logistic regression scores ${pct(r.features.modelTest.accuracy)} accuracy, ${pct(r.features.modelTest.balancedAccuracy)} balanced accuracy and ${r.features.modelTest.rocAuc.toFixed(3)} ROC-AUC on held-out rows. Reading the generator shows a ceiling: labels are a threshold on a score that is then flipped at random for 10% of students, so no model can exceed about 90% accuracy. Adding the generator's own latent score — a column that would not exist at prediction time — lifts accuracy to ${pct(r["with-leak"].modelTest.accuracy)}.`,
    relatedWork: ["Standard practice: report a majority-class baseline, balanced accuracy and ROC-AUC under class imbalance; evaluate on held-out data."],
    methodology: [
      "Stratified 80/20 split with a fixed seed (42); numeric features standardised with training-set statistics only; branch one-hot encoded.",
      "Logistic regression by full-batch gradient descent (learning rate 0.5, 400 epochs, L2 0.001), implemented in TypeScript for the browser.",
      "Majority-class baseline learned from the training split; its predicted probability is the training positive rate (ROC-AUC 0.5).",
      `Independent check: scikit-learn on exactly the same rows gives accuracy ${verification.sklearn.accuracy}, balanced accuracy ${verification.sklearn.balanced_accuracy} and ROC-AUC ${verification.sklearn.roc_auc}.`,
    ],
    dataset: [
      "training_data.csv from the Placement Portal repository: 10,000 synthetic rows, 66.97% placed.",
      "Features: CGPA, internship, project, certification and skill counts, branch code (0–5).",
      "Generator: placed = (capped weighted score + uniform(−3, 3) noise > 50), then flipped for a random 10% of rows.",
      "placement_probability is the generator's latent score — included only to demonstrate leakage.",
    ],
    setup: ["Runs in a Web Worker in the AI Lab; every run is bounded (≤ 10,000 rows, ≤ 2,000 epochs).", "Canonical runs: scripts/placement-experiment.ts (Node) and scripts/verify_placement_experiment.py (scikit-learn)."],
    baselines: ["Majority class (always 'placed')", "CGPA-only logistic regression"],
    metrics: ["Accuracy", "Balanced accuracy", "ROC-AUC", "F1", "Confusion matrix", "Train vs test gap"],
    results: {
      caption: `Held-out test set (${r.features.split.test.toLocaleString("en-IN")} rows, seed 42). Computed ${experiment.generatedAt}.`,
      columns: ["Model", "Accuracy", "Balanced acc.", "ROC-AUC", "F1"],
      rows: [
        ["Majority-class baseline", pct(r.features.baselineTest.accuracy), pct(r.features.baselineTest.balancedAccuracy), r.features.baselineTest.rocAuc.toFixed(3), r.features.baselineTest.f1.toFixed(3)],
        ["Logistic regression — CGPA only", pct(r["cgpa-only"].modelTest.accuracy), pct(r["cgpa-only"].modelTest.balancedAccuracy), r["cgpa-only"].modelTest.rocAuc.toFixed(3), r["cgpa-only"].modelTest.f1.toFixed(3)],
        ["Logistic regression — all features", pct(r.features.modelTest.accuracy), pct(r.features.modelTest.balancedAccuracy), r.features.modelTest.rocAuc.toFixed(3), r.features.modelTest.f1.toFixed(3)],
        ["… with balanced class weights", pct(r["features-balanced"].modelTest.accuracy), pct(r["features-balanced"].modelTest.balancedAccuracy), r["features-balanced"].modelTest.rocAuc.toFixed(3), r["features-balanced"].modelTest.f1.toFixed(3)],
        ["… plus the leaky latent score", pct(r["with-leak"].modelTest.accuracy), pct(r["with-leak"].modelTest.balancedAccuracy), r["with-leak"].modelTest.rocAuc.toFixed(3), r["with-leak"].modelTest.f1.toFixed(3)],
        ["scikit-learn check (all features)", pct(verification.sklearn.accuracy), pct(verification.sklearn.balanced_accuracy), verification.sklearn.roc_auc.toFixed(3), verification.sklearn.f1.toFixed(3)],
      ],
      findings: [
        "Accuracy alone is misleading: the trivial baseline already scores 67% here, and 96.5%+ on the 50,000-row file the original report used.",
        `The model is not overfitting: train accuracy ${pct(r.features.modelTrain.accuracy)} vs test ${pct(r.features.modelTest.accuracy)}.`,
        "Coefficients recover the generator's structure: CGPA is the strongest numeric feature and branch effects rise monotonically with branch code.",
        "Balancing class weights trades accuracy for recall of 'not placed' students without changing ROC-AUC.",
        "Because 10% of labels are flipped at random, ~90% accuracy is the ceiling for any model on this data.",
      ],
    },
    figures: [],
    reproducibility: [
      "Open the AI Lab, keep the defaults (seed 42) and run — the numbers above reappear.",
      "node scripts/placement-experiment.ts",
      "node scripts/placement-experiment.ts --export-split split.json && python scripts/verify_placement_experiment.py public/data/placement-training.json split.json",
    ],
    limitations: [
      "The data is synthetic: the analysis evaluates a generator, not real students.",
      "A single split and seed; intervals across seeds are not reported here (the AI Lab lets you change the seed).",
      "Only logistic regression is re-run; the portal's ensemble models were not re-trained.",
    ],
    contributions: "Analysis and implementation by Shivam Patil, with an AI coding assistant, for this portfolio.",
    links: [{ label: "Placement Portal repository", href: "https://github.com/shivampatil4972/placement-prediction-portal", kind: "repo" }],
    asOf: "2026-10-25",
  },
  {
    id: "intelligrade-ocr-benchmark",
    title: "Choosing an OCR engine for scanned answer sheets",
    question: "Which open-source OCR engine should a CPU-only examination platform use by default?",
    status: "internal-report",
    statusNote: "Engineering benchmark recorded in IntelliGrade AI's docs/ai-evaluation.md (2026-10-13). Repository not yet public.",
    projectSlug: "intelligrade-ai",
    abstract:
      "Three engines were run on the same 12 synthetic printed pages — three exam-style texts (6,968 characters) in three fonts under four conditions: clean, blur + noise, 2.5° skew with uneven lighting, and half resolution with heavy JPEG compression — each in its own container limited to 2 CPUs and 3 GB. Tesseract 5.5 had the lowest character error rate (0.44%), ran about 20× faster than the next engine and peaked at 84 MB, so it became the default. The benchmark contains no handwriting, which is what real answer sheets mostly are.",
    relatedWork: [placeholder("Add any OCR evaluation references you consulted.")],
    methodology: ["Character and word error rates against ground truth after whitespace normalisation.", "Seconds per page, load + first page time and peak memory per engine container."],
    dataset: ["12 synthetic printed pages: biology, physics and history texts in DejaVu Sans, Liberation Serif and Liberation Mono."],
    setup: ["python:3.12-slim containers, 2 CPUs and 3 GB each; scripts and per-page results in ai-service/benchmarks/ocr/."],
    baselines: ["PaddleOCR 3.7 (PP-OCRv6 medium)", "RapidOCR 3.10 (PP-OCRv6 small, ONNX Runtime)"],
    metrics: ["CER", "WER", "Seconds per page", "Peak memory"],
    results: {
      caption: "OCR engine comparison, 2026-10-13 (docs/ai-evaluation.md §3.1).",
      columns: ["Engine", "CER", "WER", "s / page", "Peak memory"],
      rows: [
        ["Tesseract 5.5.0", "0.44%", "2.72%", "0.65", "84 MB"],
        ["PaddleOCR 3.7.0", "1.48%", "1.11%", "74.8", "3,048 MB (limit)"],
        ["RapidOCR 3.10.0", "6.75%", "8.76%", "12.4", "722 MB"],
      ],
      findings: [
        "Tesseract: most accurate by character, ~20× faster than the next engine, a fraction of the memory.",
        "PaddleOCR has the best WER and is perfect on clean pages but fails on skew (5.86% CER) and ran at its memory limit with acceleration disabled.",
        "Part of the box-based engines' error comes from this benchmark's line ordering, not recognition.",
      ],
    },
    figures: [],
    reproducibility: ["sh ai-service/benchmarks/ocr/run.sh (in the IntelliGrade AI repository)"],
    limitations: ["No handwriting.", "Twelve pages from three texts; sub-percent differences are not meaningful.", "The service's own preprocessing (deskew, contrast) was not applied."],
    contributions: "Benchmark designed and run by Shivam Patil, with an AI coding assistant.",
    links: [],
    asOf: "2026-10-13",
  },
];

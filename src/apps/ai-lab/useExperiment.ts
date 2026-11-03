"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperimentConfig, ExperimentResult, PlacementDataset } from "@/lib/ml/experiment";
import { clearActivity, publishActivity } from "@/os/state/activity";

export type RunStage = "idle" | "loading" | "training" | "done" | "error";

interface WorkerMessage {
  id: number;
  stage: Exclude<RunStage, "idle">;
  result?: ExperimentResult;
  error?: string;
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/**
 * Runs experiments in a Web Worker so training never blocks the interface.
 * Falls back to the main thread when workers are unavailable.
 * Activity-pill events mirror the real stages: loading → training → done.
 */
export function useExperiment() {
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const activityId = useRef<number | null>(null);
  const [stage, setStage] = useState<RunStage>("idle");
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback((msg: WorkerMessage) => {
    if (msg.id !== seq.current) return; // a newer run superseded this one
    setStage(msg.stage);
    if (msg.stage === "loading") activityId.current = publishActivity({ kind: "running", title: "Experiment running", detail: "Loading 10,000 rows…", sticky: true });
    if (msg.stage === "training") activityId.current = publishActivity({ kind: "running", title: "Experiment running", detail: "Training logistic regression…", sticky: true });
    if (msg.stage === "done" && msg.result) {
      setResult(msg.result);
      setError(null);
      const m = msg.result.model.test;
      const b = msg.result.baseline.test;
      publishActivity({ kind: "completed", title: "Experiment completed", detail: `Accuracy ${pct(m.accuracy)} vs baseline ${pct(b.accuracy)} · ${Math.round(msg.result.runtimeMs)} ms` });
    }
    if (msg.stage === "error") {
      setError(msg.error ?? "Unknown error");
      if (activityId.current !== null) clearActivity(activityId.current);
      publishActivity({ kind: "error", title: "Experiment failed", detail: msg.error });
    }
  }, []);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    try {
      const w = new Worker(new URL("./experiment.worker.ts", import.meta.url), { type: "module" });
      w.onmessage = (e: MessageEvent<WorkerMessage>) => handle(e.data);
      w.onerror = () => {
        worker.current = null;
      };
      worker.current = w;
      return () => w.terminate();
    } catch {
      worker.current = null;
    }
  }, [handle]);

  const run = useCallback(
    async (config: ExperimentConfig) => {
      seq.current += 1;
      const id = seq.current;
      if (worker.current) {
        worker.current.postMessage({ id, config });
        return;
      }
      // Main-thread fallback.
      try {
        handle({ id, stage: "loading" });
        const [{ runExperiment }, data] = await Promise.all([
          import("@/lib/ml/experiment"),
          fetch("/data/placement-training.json").then((r) => {
            if (!r.ok) {
              void r.body?.cancel();
              throw new Error(`Dataset request failed (${r.status})`);
            }
            return r.json() as Promise<PlacementDataset>;
          }),
        ]);
        handle({ id, stage: "training" });
        await new Promise((r) => setTimeout(r, 0));
        handle({ id, stage: "done", result: runExperiment(data, config) });
      } catch (err) {
        handle({ id, stage: "error", error: err instanceof Error ? err.message : String(err) });
      }
    },
    [handle],
  );

  return { run, stage, result, error, running: stage === "loading" || stage === "training" };
}

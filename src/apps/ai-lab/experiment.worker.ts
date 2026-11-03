/// <reference lib="webworker" />
import { runExperiment, type ExperimentConfig, type PlacementDataset } from "@/lib/ml/experiment";

let dataset: PlacementDataset | null = null;

type Request = { id: number; config: ExperimentConfig };

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, config } = event.data;
  try {
    if (!dataset) {
      self.postMessage({ id, stage: "loading" });
      const res = await fetch("/data/placement-training.json");
      if (!res.ok) throw new Error(`Dataset request failed (${res.status})`);
      dataset = (await res.json()) as PlacementDataset;
    }
    self.postMessage({ id, stage: "training" });
    const result = runExperiment(dataset, config);
    self.postMessage({ id, stage: "done", result });
  } catch (err) {
    self.postMessage({ id, stage: "error", error: err instanceof Error ? err.message : String(err) });
  }
};

/** X-Ray schemas: run by the unit tests and CI, never shipped to the browser. */
import { z } from "zod";
import { safeHref } from "./schema";

export const nodeStatus = z.enum(["implemented", "unverified", "simulated", "proposed"]);

export const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["client", "service", "store", "external", "research"]),
  tech: z.string(),
  /** Position on a 1000 × 560 canvas (centre of the node). */
  x: z.number().min(60).max(940),
  y: z.number().min(40).max(520),
  status: nodeStatus,
  responsibility: z.string(),
  interfaces: z.array(z.string()).default([]),
  data: z.array(z.string()).default([]),
  tests: z.string().optional(),
  source: safeHref.optional(),
  tradeoff: z.string().optional(),
});

export const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string(),
  status: nodeStatus.default("implemented"),
});

export const systemSchema = z
  .object({
    id: z.string(),
    projectSlug: z.string(),
    title: z.string(),
    summary: z.string(),
    rule: z.string(),
    nodes: z.array(nodeSchema).min(2),
    edges: z.array(edgeSchema).min(1),
    sourceNote: z.string(),
  })
  .refine((s) => s.edges.every((e) => s.nodes.some((n) => n.id === e.from) && s.nodes.some((n) => n.id === e.to)), {
    message: "Every edge must connect existing nodes",
  });

export type XrayNode = z.infer<typeof nodeSchema>;
export type XrayEdge = z.infer<typeof edgeSchema>;
export type XraySystem = z.infer<typeof systemSchema>;
export type XrayStatus = z.infer<typeof nodeStatus>;

export type XraySystemInput = z.input<typeof systemSchema>;

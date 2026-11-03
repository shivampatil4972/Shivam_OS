import { z } from "zod";

export const checkStatus = z.enum(["passed", "failed", "warning", "not-run", "unavailable"]);
export type CheckStatus = z.infer<typeof checkStatus>;

export const qualityReportSchema = z.object({
  generatedAt: z.string(),
  commit: z.string().nullable(),
  environment: z.object({ node: z.string(), platform: z.string(), browser: z.string().nullable() }),
  checks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.enum(["code", "tests", "accessibility", "performance", "links", "dependencies", "content"]),
      status: checkStatus,
      command: z.string(),
      ranAt: z.string().nullable(),
      durationMs: z.number().nullable(),
      summary: z.string(),
      metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      details: z.array(z.string()).default([]),
    }),
  ),
});

export type QualityReport = z.infer<typeof qualityReportSchema>;

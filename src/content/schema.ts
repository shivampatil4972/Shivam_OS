import { z } from "zod";

/**
 * Content integrity rules
 * -----------------------
 * - Every claim that is not common knowledge carries a `source` describing
 *   where it was verified (résumé, repository document, commit, certificate).
 * - Anything unknown is written with `placeholder()` so it renders as an
 *   editable placeholder and can be counted by tests, never silently invented.
 * - These schemas run in the unit tests and CI, not in the browser: the site
 *   ships plain typed data, so the validator adds no JavaScript or start-up work.
 */
export { PLACEHOLDER_PREFIX, isPlaceholder, placeholder, stripPlaceholder } from "./placeholder";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase-kebab-case");

/** Only https links (or same-origin paths) are allowed in content. */
export const safeHref = z
  .string()
  .refine((href) => href.startsWith("/") || href.startsWith("mailto:") || /^https:\/\/[^\s]+$/.test(href), {
    message: "Links must be https://, mailto: or a same-origin path",
  });

export const linkSchema = z.object({
  label: z.string().min(1),
  href: safeHref,
  kind: z.enum(["repo", "demo", "docs", "paper", "report", "file", "commit", "profile", "other"]),
});
export type Link = z.infer<typeof linkSchema>;

export const evidenceSchema = z.object({
  id: slug,
  label: z.string().min(1),
  kind: z.enum(["source", "test", "doc", "report", "demo", "commit", "certificate", "dataset", "screenshot"]),
  href: safeHref.optional(),
  note: z.string().min(1),
  /** Where this was verified while building the portfolio. */
  verifiedFrom: z.string().min(1),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const mediaSchema = z.object({
  src: z.string().startsWith("/"),
  alt: z.string().min(8),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
});
export type Media = z.infer<typeof mediaSchema>;

export const projectCategory = z.enum(["ai-ml", "full-stack", "data-analytics", "systems", "research"]);
export type ProjectCategory = z.infer<typeof projectCategory>;

export const projectStatus = z.enum(["in-development", "completed", "hackathon", "early-build"]);
export type ProjectStatus = z.infer<typeof projectStatus>;

export const evolutionKind = z.enum(["milestone", "prototype", "refactor", "fix", "experiment", "lesson", "release"]);

export const projectSchema = z.object({
  id: slug,
  slug,
  title: z.string().min(2),
  tagline: z.string().min(10),
  summary: z.string().min(40),
  category: projectCategory,
  secondaryCategories: z.array(projectCategory).default([]),
  status: projectStatus,
  statusNote: z.string().min(5),
  featured: z.boolean(),
  /** Lower ranks appear first in "Featured" sort. */
  rank: z.number().int().min(1),
  period: z.object({ start: isoMonth, end: z.union([isoMonth, z.literal("ongoing")]) }),
  team: z.object({ size: z.number().int().positive().nullable(), note: z.string() }),
  role: z.string().min(2),
  technologies: z.array(z.string().min(1)).min(1),
  contribution: z.object({
    summary: z.string().min(5),
    items: z.array(z.string().min(3)),
  }),
  /** Disclosure of AI pair-programming, derived from commit trailers. Null when none was found. */
  aiAssistance: z.string().nullable(),
  problem: z.string().min(20),
  targetUsers: z.array(z.string().min(2)).min(1),
  solution: z.string().min(20),
  workflows: z.array(z.string().min(5)).min(1),
  techRationale: z.array(z.object({ tech: z.string(), why: z.string().min(5) })).min(1),
  architecture: z.object({
    summary: z.string().min(20),
    dataFlow: z.array(z.string().min(5)).min(1),
    xrayId: z.string().optional(),
  }),
  implementation: z.array(z.string().min(5)).min(1),
  challenges: z.array(z.object({ title: z.string(), detail: z.string().min(10) })).min(1),
  tradeoffs: z.array(z.object({ decision: z.string(), alternatives: z.string(), cost: z.string() })).min(1),
  testing: z.object({
    summary: z.string().min(10),
    suites: z.array(
      z.object({
        name: z.string(),
        detail: z.string(),
        count: z.number().int().nonnegative().nullable(),
        status: z.enum(["reported-passing", "defined-not-run-here", "not-available"]),
        asOf: isoDate.nullable(),
        source: z.string(),
      }),
    ),
  }),
  results: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      context: z.string().min(10),
      source: z.string().min(3),
    }),
  ),
  limitations: z.array(z.string().min(10)).min(1),
  lessons: z.array(z.string().min(10)).min(1),
  future: z.array(z.string().min(5)).min(1),
  setup: z.object({ steps: z.array(z.string().min(3)).min(1), note: z.string().optional() }),
  links: z.array(linkSchema),
  media: z.object({ cover: mediaSchema.optional(), gallery: z.array(mediaSchema).default([]) }),
  evolution: z.array(
    z.object({
      date: isoDate,
      kind: evolutionKind,
      title: z.string().min(3),
      detail: z.string().min(5),
      ref: z.string().optional(),
      href: safeHref.optional(),
    }),
  ),
  evidence: z.array(evidenceSchema),
  updated: isoDate,
});
export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.input<typeof projectSchema>;

export const skillSchema = z.object({
  id: slug,
  name: z.string(),
  group: z.enum([
    "languages",
    "frontend",
    "backend",
    "databases",
    "data-science",
    "ai-ml",
    "cloud-devops",
    "testing",
    "tools",
    "cs-foundations",
  ]),
  /** How the skill is evidenced — never a self-rated percentage. */
  evidenceLevel: z.enum(["shipped", "project", "coursework", "certified", "listed"]),
  projects: z.array(slug),
  certifications: z.array(slug).default([]),
  note: z.string().optional(),
});
export type Skill = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  id: slug,
  title: z.string(),
  issuer: z.string(),
  date: z.union([isoMonth, z.literal("undated")]),
  kind: z.enum(["course", "job-simulation", "badge", "assessment"]),
  onResume: z.boolean(),
  verifiedFrom: z.string(),
});
export type Certification = z.infer<typeof certificationSchema>;

export const awardSchema = z.object({
  id: slug,
  title: z.string(),
  detail: z.string(),
  date: z.string(),
  verifiedFrom: z.string(),
});
export type Award = z.infer<typeof awardSchema>;

export const experienceSchema = z.object({
  id: slug,
  role: z.string(),
  organization: z.string(),
  type: z.enum(["internship", "leadership", "virtual-simulation", "teaching"]),
  start: z.string(),
  end: z.string(),
  location: z.string(),
  summary: z.string(),
  responsibilities: z.array(z.string()).min(1),
  contributions: z.array(z.string()),
  technologies: z.array(z.string()),
  outcomes: z.array(z.string()),
  lessons: z.array(z.string()),
  verifiedFrom: z.string(),
});
export type Experience = z.infer<typeof experienceSchema>;

export const researchSchema = z.object({
  id: slug,
  title: z.string(),
  question: z.string(),
  status: z.enum(["draft", "internal-report", "submitted", "accepted", "published", "unpublished-project-research"]),
  statusNote: z.string(),
  projectSlug: slug.optional(),
  abstract: z.string().min(50),
  relatedWork: z.array(z.string()),
  methodology: z.array(z.string()).min(1),
  dataset: z.array(z.string()).min(1),
  setup: z.array(z.string()).min(1),
  baselines: z.array(z.string()).min(1),
  metrics: z.array(z.string()).min(1),
  results: z.object({
    caption: z.string(),
    columns: z.array(z.string()).min(2),
    rows: z.array(z.array(z.string())).min(1),
    findings: z.array(z.string()).min(1),
  }),
  figures: z.array(mediaSchema),
  reproducibility: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
  contributions: z.string(),
  links: z.array(linkSchema),
  asOf: isoDate,
});
export type Research = z.infer<typeof researchSchema>;

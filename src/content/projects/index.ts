import type { Project, ProjectCategory, ProjectInput, ProjectStatus } from "../schema";
import { intelligrade } from "./intelligrade";
import { journex } from "./journex";
import {
  bachatGat,
  indradhanu,
  neuroRoute,
  phonepe,
  placementAnalytics,
  placementPortal,
  roadAccident,
  safas,
  starbucks,
  studentResult,
  supportTriage,
  ticketingTool,
} from "./more";

/** Unparsed content, validated against `projectSchema` by the unit tests and CI. */
export const rawProjects: ProjectInput[] = [
  journex,
  intelligrade,
  supportTriage,
  ticketingTool,
  placementPortal,
  neuroRoute,
  placementAnalytics,
  bachatGat,
  studentResult,
  safas,
  indradhanu,
  phonepe,
  starbucks,
  roadAccident,
];

/** Applies the schema's defaults without shipping the validator to the browser. */
function normalize(p: ProjectInput): Project {
  return { ...p, secondaryCategories: p.secondaryCategories ?? [], media: { ...p.media, gallery: p.media.gallery ?? [] } } as Project;
}

export const projects: Project[] = rawProjects.map(normalize).sort((a, b) => a.rank - b.rank);

export const projectBySlug = new Map(projects.map((p) => [p.slug, p]));

export function getProject(slug: string): Project | undefined {
  return projectBySlug.get(slug);
}

export const categoryLabels: Record<ProjectCategory, string> = {
  "ai-ml": "AI & ML",
  "full-stack": "Full-stack",
  "data-analytics": "Data analytics",
  systems: "Systems",
  research: "Research",
};

export const statusLabels: Record<ProjectStatus, string> = {
  "in-development": "In development",
  completed: "Completed",
  hackathon: "Hackathon",
  "early-build": "Early build",
};

export const allTechnologies = Array.from(new Set(projects.flatMap((p) => p.technologies))).sort((a, b) =>
  a.localeCompare(b),
);

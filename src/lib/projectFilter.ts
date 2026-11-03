import type { Project, ProjectCategory, ProjectStatus } from "@/content/schema";
import { normalize } from "./search";

export type ProjectSort = "featured" | "newest" | "title";

export interface ProjectQuery {
  text: string;
  category: ProjectCategory | "all";
  status: ProjectStatus | "all";
  tech: string | "all";
  sort: ProjectSort;
}

export const DEFAULT_PROJECT_QUERY: ProjectQuery = { text: "", category: "all", status: "all", tech: "all", sort: "featured" };

/** Sortable end date: ongoing work sorts as the most recent. */
function endKey(p: Project): string {
  return p.period.end === "ongoing" ? "9999-12" : p.period.end;
}

export function filterProjects(list: Project[], q: ProjectQuery): Project[] {
  const tokens = normalize(q.text).split(" ").filter(Boolean);
  const filtered = list.filter((p) => {
    if (q.category !== "all" && p.category !== q.category && !p.secondaryCategories.includes(q.category)) return false;
    if (q.status !== "all" && p.status !== q.status) return false;
    if (q.tech !== "all" && !p.technologies.includes(q.tech)) return false;
    if (tokens.length) {
      const hay = normalize([p.title, p.tagline, p.summary, p.technologies.join(" "), p.category].join(" "));
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
  const sorted = [...filtered];
  if (q.sort === "featured") sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.rank - b.rank);
  else if (q.sort === "newest") sorted.sort((a, b) => endKey(b).localeCompare(endKey(a)) || b.period.start.localeCompare(a.period.start) || a.rank - b.rank);
  else sorted.sort((a, b) => a.title.localeCompare(b.title));
  return sorted;
}
